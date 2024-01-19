/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { filterTruthy } from "../../../../utils/utils";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { OperationTranspileResult } from "./operations";
import { MutationOperation, Operation } from "./operations";
import type { EntitySelection, SelectionClause } from "../selection/EntitySelection";
import type { Filter } from "../filters/Filter";
import { wrapSubqueriesInCypherCalls } from "../../utils/wrap-subquery-in-calls";
import type { InterfaceEntityAdapter } from "../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";

export class DeleteOperation extends MutationOperation {
    public readonly target: ConcreteEntityAdapter | InterfaceEntityAdapter;
    public nodeAlias: string | undefined; // This is just to maintain naming with the old way (this), remove after refactor
    private selection: EntitySelection;
    private filters: Filter[];
    private authFilters: Filter[];
    private nestedOperations: Operation[];

    constructor({
        target,
        selection,
        nestedOperations = [],
        filters = [],
        authFilters = [],
    }: {
        target: ConcreteEntityAdapter | InterfaceEntityAdapter;
        selection: EntitySelection;
        filters?: Filter[];
        nestedOperations?: DeleteOperation[];
        authFilters?: Filter[];
    }) {
        super();
        this.target = target;
        this.selection = selection;
        this.filters = filters;
        this.authFilters = authFilters;
        this.nestedOperations = nestedOperations;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([this.selection, ...this.filters, ...this.authFilters, ...this.nestedOperations]);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const { selection, nestedContext } = this.selection.apply(context);
        if (nestedContext.relationship) {
            return this.transpileNested(selection, nestedContext);
        }
        return this.transpileTopLevel(selection, nestedContext);
    }

    private transpileTopLevel(
        selection: SelectionClause,
        context: QueryASTContext<Cypher.Node>
    ): OperationTranspileResult {
        this.validateSelection(selection);
        const filterSubqueries = wrapSubqueriesInCypherCalls(context, this.filters, [context.target]);
        const authBeforeSubqueries = this.getAuthFilterSubqueries(context);
        const predicate = this.getPredicate(context);
        const extraSelections = this.getExtraSelections(context);

        const nestedOperations: (Cypher.Call | Cypher.With)[] = this.getNestedDeleteSubQueries(context);

        let statements = [selection, ...extraSelections, ...filterSubqueries, ...authBeforeSubqueries];

        statements = this.appendFilters(statements, predicate);
        if (nestedOperations.length) {
            statements.push(new Cypher.With("*"), ...nestedOperations);
        }
        statements = this.appendDeleteClause(statements, context);
        const ret = Cypher.concat(...statements);

        return { clauses: [ret], projectionExpr: context.target };
    }

    private transpileNested(
        selection: SelectionClause,
        context: QueryASTContext<Cypher.Node>
    ): OperationTranspileResult {
        this.validateSelection(selection);
        if (!context.relationship) {
            throw new Error("Transpile error: No relationship found!");
        }
        const filterSubqueries = wrapSubqueriesInCypherCalls(context, this.filters, [context.target]);
        const authBeforeSubqueries = this.getAuthFilterSubqueries(context);
        const predicate = this.getPredicate(context);
        const extraSelections = this.getExtraSelections(context);
        const collect = Cypher.collect(context.target).distinct();
        const deleteVar = new Cypher.Variable();
        const withBeforeDeleteBlock = new Cypher.With(context.relationship, [collect, deleteVar]);

        const unwindDeleteVar = new Cypher.Variable();
        const deleteClause = new Cypher.Unwind([deleteVar, unwindDeleteVar]).detachDelete(unwindDeleteVar);

        const deleteBlock = new Cypher.Call(deleteClause).innerWith(deleteVar);
        const nestedOperations: (Cypher.Call | Cypher.With)[] = this.getNestedDeleteSubQueries(context);
        const statements = this.appendFilters(
            [selection, ...extraSelections, ...filterSubqueries, ...authBeforeSubqueries],
            predicate
        );

        if (nestedOperations.length) {
            statements.push(new Cypher.With("*"), ...nestedOperations);
        }
        statements.push(withBeforeDeleteBlock, deleteBlock);
        const ret = Cypher.concat(...statements);
        return { clauses: [ret], projectionExpr: Cypher.Null };
    }

    private appendDeleteClause(clauses: Cypher.Clause[], context: QueryASTContext<Cypher.Node>): Cypher.Clause[] {
        const lastClause = this.getLastClause(clauses);
        if (
            lastClause instanceof Cypher.Match ||
            lastClause instanceof Cypher.OptionalMatch ||
            lastClause instanceof Cypher.With
        ) {
            lastClause.detachDelete(context.target);
            return clauses;
        }
        const extraWith = new Cypher.With("*");
        extraWith.detachDelete(context.target);
        clauses.push(extraWith);
        return clauses;
    }

    private getLastClause(clauses: Cypher.Clause[]): Cypher.Clause {
        const lastClause = clauses[clauses.length - 1];
        if (!lastClause) {
            throw new Error("Transpile error");
        }
        return lastClause;
    }

    private appendFilters(clauses: Cypher.Clause[], predicate: Cypher.Predicate | undefined): Cypher.Clause[] {
        if (!predicate) {
            return clauses;
        }
        const lastClause = this.getLastClause(clauses);
        if (
            lastClause instanceof Cypher.Match ||
            lastClause instanceof Cypher.OptionalMatch ||
            lastClause instanceof Cypher.With
        ) {
            lastClause.where(predicate);
            return clauses;
        }
        const withClause = new Cypher.With("*");
        withClause.where(predicate);
        clauses.push(withClause);
        return clauses;
    }

    private getNestedDeleteSubQueries(context: QueryASTContext): Cypher.Call[] {
        const nestedOperations: Cypher.Call[] = [];
        for (const nestedDeleteOperation of this.nestedOperations) {
            const { clauses } = nestedDeleteOperation.transpile(context);
            nestedOperations.push(...clauses.map((c) => new Cypher.Call(c).innerWith("*")));
        }
        return nestedOperations;
    }

    private validateSelection(selection: SelectionClause): asserts selection is Cypher.Match {
        if (!(selection instanceof Cypher.Match)) {
            throw new Error("Yield is not a valid selection for Delete Operation");
        }
    }

    private getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const authBeforePredicates = this.getAuthFilterPredicate(queryASTContext);
        return Cypher.and(...this.filters.map((f) => f.getPredicate(queryASTContext)), ...authBeforePredicates);
    }

    private getAuthFilterSubqueries(context: QueryASTContext): Cypher.Clause[] {
        return this.authFilters.flatMap((f) => f.getSubqueries(context));
    }

    private getAuthFilterPredicate(context: QueryASTContext): Cypher.Predicate[] {
        return filterTruthy(this.authFilters.map((f) => f.getPredicate(context)));
    }

    private getExtraSelections(context: QueryASTContext): (Cypher.Match | Cypher.With)[] {
        return this.getChildren().flatMap((f) => f.getSelection(context));
    }
}

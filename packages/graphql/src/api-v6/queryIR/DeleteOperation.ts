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
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { Filter } from "../../translate/queryAST/ast/filters/Filter";
import type { DeleteOperation } from "../../translate/queryAST/ast/operations/DeleteOperation";
import type { OperationTranspileResult } from "../../translate/queryAST/ast/operations/operations";
import { MutationOperation } from "../../translate/queryAST/ast/operations/operations";
import type { QueryASTContext } from "../../translate/queryAST/ast/QueryASTContext";
import type { QueryASTNode } from "../../translate/queryAST/ast/QueryASTNode";
import type { EntitySelection, SelectionClause } from "../../translate/queryAST/ast/selection/EntitySelection";
import { wrapSubqueriesInCypherCalls } from "../../translate/queryAST/utils/wrap-subquery-in-calls";

export class V6DeleteOperation extends MutationOperation {
    public readonly target: ConcreteEntityAdapter | InterfaceEntityAdapter;
    private selection: EntitySelection;
    private filters: Filter[];
    private nestedOperations: MutationOperation[];

    constructor({
        target,
        selection,
        nestedOperations = [],
        filters = [],
    }: {
        target: ConcreteEntityAdapter | InterfaceEntityAdapter;
        selection: EntitySelection;
        filters?: Filter[];
        nestedOperations?: DeleteOperation[];
    }) {
        super();
        this.target = target;
        this.selection = selection;
        this.filters = filters;
        this.nestedOperations = nestedOperations;
    }

    public getChildren(): QueryASTNode[] {
        return [this.selection, ...this.filters, ...this.nestedOperations];
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
        const predicate = this.getPredicate(context);
        const extraSelections = this.getExtraSelections(context);

        const nestedOperations: (Cypher.Call | Cypher.With)[] = this.getNestedDeleteSubQueries(context);

        let statements = [selection, ...extraSelections, ...filterSubqueries];

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
        const predicate = this.getPredicate(context);
        const extraSelections = this.getExtraSelections(context);
        const collect = Cypher.collect(context.target).distinct();
        const deleteVar = new Cypher.Variable();
        const withBeforeDeleteBlock = new Cypher.With(context.relationship, [collect, deleteVar]);

        const unwindDeleteVar = new Cypher.Variable();
        const deleteClause = new Cypher.Unwind([deleteVar, unwindDeleteVar]).detachDelete(unwindDeleteVar);

        const deleteBlock = new Cypher.Call(deleteClause).importWith(deleteVar);
        const nestedOperations: (Cypher.Call | Cypher.With)[] = this.getNestedDeleteSubQueries(context);
        const statements = this.appendFilters([selection, ...extraSelections, ...filterSubqueries], predicate);

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
            nestedOperations.push(...clauses.map((c) => new Cypher.Call(c).importWith("*")));
        }
        return nestedOperations;
    }

    private validateSelection(selection: SelectionClause): asserts selection is Cypher.Match | Cypher.With {
        if (!(selection instanceof Cypher.Match || selection instanceof Cypher.With)) {
            throw new Error("Cypher Yield statement is not a valid selection for Delete Operation");
        }
    }

    private getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        return Cypher.and(...this.filters.map((f) => f.getPredicate(queryASTContext)));
    }

    private getExtraSelections(context: QueryASTContext): (Cypher.Match | Cypher.With)[] {
        return this.getChildren().flatMap((f) => f.getSelection(context));
    }
}

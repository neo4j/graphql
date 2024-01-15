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
import type { ReadOperation } from "./ReadOperation";
import type { OperationTranspileResult } from "./operations";
import { Operation } from "./operations";
import { hasTarget } from "../../utils/context-has-target";
import type { EntitySelection, SelectionClause } from "../selection/EntitySelection";
import type { Filter } from "../filters/Filter";

export class DeleteOperation extends Operation {
    public readonly target: ConcreteEntityAdapter;
    public projectionOperations: ReadOperation[] = [];
    public nodeAlias: string | undefined; // This is just to maintain naming with the old way (this), remove after refactor
    private selection: EntitySelection;
    private filters: Filter[];
    private nestedDeleteOperations: DeleteOperation[];

    constructor({
        target,
        selection,
        filters,
        nestedDeleteOperations = [],
    }: {
        target: ConcreteEntityAdapter;
        selection: EntitySelection;
        filters: Filter[];
        nestedDeleteOperations?: DeleteOperation[];
    }) {
        super();
        this.target = target;
        this.selection = selection;
        this.filters = filters;
        this.nestedDeleteOperations = nestedDeleteOperations;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([
            this.selection,
            ...this.filters,
            ...(this.nestedDeleteOperations ?? []),
            ...this.projectionOperations,
        ]);
    }

    public transpileNested(
        selection: SelectionClause,
        context: QueryASTContext<Cypher.Node>
    ): OperationTranspileResult {
        this.validateSelection(selection);
        if (!context.relationship) {
            throw new Error("Transpile Error");
        }
        selection.optional();
        const predicate = this.getPredicate(context);
        if (predicate) {
            selection.where(predicate);
        }
        const collect = Cypher.collect(context.target).distinct();
        const deleteVar = new Cypher.Variable();
        const withBeforeDeleteBlock = new Cypher.With(context.relationship, [collect, deleteVar]);

        const unwindDeleteVar = new Cypher.Variable();
        const deleteClause = new Cypher.Unwind([deleteVar, unwindDeleteVar]).detachDelete(unwindDeleteVar);

        const deleteBlock = new Cypher.Call(deleteClause).innerWith(deleteVar);
        const nestedDeleteOperations: Cypher.Call[] = this.getNestedSubQueries(context);
        let ret: Cypher.Clause;
        if (nestedDeleteOperations.length > 0) {
            const withBeforeCalls = new Cypher.With("*");

            ret = Cypher.concat(
                selection,
                withBeforeCalls,
                ...nestedDeleteOperations,
                withBeforeDeleteBlock,
                deleteBlock
            );
        } else {
            ret = Cypher.concat(selection, withBeforeDeleteBlock, deleteBlock);
        }
        return { clauses: [ret], projectionExpr: new Cypher.NamedNode("IDK") };
    }

    public transpileTopLevel(
        selection: SelectionClause,
        context: QueryASTContext<Cypher.Node>
    ): OperationTranspileResult {
        this.validateSelection(selection);
        const predicate = this.getPredicate(context);
        if (predicate) {
            selection.where(predicate);
        }
        const nestedDeleteOperations: Cypher.Call[] = this.getNestedSubQueries(context);
        let ret: Cypher.Clause;
        if (nestedDeleteOperations.length > 0) {
            const withBeforeCalls = new Cypher.With("*");

            ret = Cypher.concat(
                selection,
                withBeforeCalls,
                ...nestedDeleteOperations,
                new Cypher.With("*").detachDelete(context.target)
            );
        } else {
            ret = selection.detachDelete(context.target);
        }

        return { clauses: [ret], projectionExpr: new Cypher.NamedNode("IDK") };
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!hasTarget(context)) {
            throw new Error("No parent node found!");
        }

        const { selection, nestedContext } = this.selection.apply(context);
        if (nestedContext.relationship) {
            return this.transpileNested(selection, nestedContext);
        }
        return this.transpileTopLevel(selection, nestedContext);
    }

    private getNestedSubQueries(context: QueryASTContext): Cypher.Call[] {
        const nestedDeleteOperations: Cypher.Call[] = [];
        for (const nestedDeleteOperation of this.nestedDeleteOperations) {
            const { clauses } = nestedDeleteOperation.transpile(context);
            nestedDeleteOperations.push(...clauses.map((c) => new Cypher.Call(c).innerWith("*")));
        }
        return nestedDeleteOperations;
    }

    private validateSelection(selection: SelectionClause): asserts selection is Cypher.Match {
        if (!(selection instanceof Cypher.Match)) {
            throw new Error("Yield is not a valid selection");
        }
    }

    private getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        //  const authPredicates = this.getAuthFilterPredicate(queryASTContext);
        return Cypher.and(...this.filters.map((f) => f.getPredicate(queryASTContext))); //, ...authPredicates);
    }
}

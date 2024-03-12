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
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { hasTarget } from "../../../utils/context-has-target";
import type { QueryASTContext } from "../../QueryASTContext";
import type { SelectionClause } from "../../selection/EntitySelection";
import { ReadOperation } from "../ReadOperation";
import type { OperationTranspileResult } from "../operations";
import { wrapSubqueriesInCypherCalls } from "../../../utils/wrap-subquery-in-calls";

export class CompositeReadPartial extends ReadOperation {
    public transpile(context: QueryASTContext) {
        if (this.relationship) {
            return this.transpileNestedCompositeRelationship(this.relationship, context);
        } else {
            return this.transpileTopLevelCompositeEntity(context);
        }
    }

    private transpileNestedCompositeRelationship(
        entity: RelationshipAdapter,
        context: QueryASTContext
    ): OperationTranspileResult {
        if (!hasTarget(context)) {
            throw new Error("No parent node found!");
        }

        // eslint-disable-next-line prefer-const
        let { selection: matchClause, nestedContext } = this.selection.apply(context);

        let extraMatches: SelectionClause[] = this.getChildren().flatMap((f) => {
            return f.getSelection(nestedContext);
        });

        const filterSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.filters, [nestedContext.target]);

        if (extraMatches.length > 0 || filterSubqueries.length > 0) {
            extraMatches = [matchClause, ...extraMatches];
            matchClause = new Cypher.With("*");
        }

        const filterPredicates = this.getPredicates(nestedContext);
        const authFilterSubqueries = this.getAuthFilterSubqueries(nestedContext);
        const authFiltersPredicate = this.getAuthFilterPredicate(nestedContext);

        const wherePredicate = Cypher.and(filterPredicates, ...authFiltersPredicate);
        if (wherePredicate) {
            // NOTE: This is slightly different to ReadOperation for cypher compatibility, this could use `WITH *`
            matchClause.where(wherePredicate);
        }

        const cypherFieldSubqueries = this.getCypherFieldsSubqueries(nestedContext);
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(nestedContext), ...cypherFieldSubqueries);
        const sortSubqueries = this.sortFields
            .flatMap((sq) => sq.getSubqueries(nestedContext))
            .map((sq) => new Cypher.Call(sq).importWith(nestedContext.target));

        const ret = this.getProjectionClause(nestedContext, context.returnVariable);

        const clause = Cypher.concat(
            ...extraMatches,
            ...filterSubqueries,
            matchClause,
            ...authFilterSubqueries,
            subqueries,
            ...sortSubqueries,
            ret
        );

        return {
            clauses: [clause],
            projectionExpr: nestedContext.returnVariable,
        };
    }

    // dupe from transpileNestedCompositeRelationship
    private transpileTopLevelCompositeEntity(context: QueryASTContext): OperationTranspileResult {
        // eslint-disable-next-line prefer-const
        let { selection: matchClause, nestedContext } = this.selection.apply(context);

        let extraMatches: SelectionClause[] = this.getChildren().flatMap((f) => {
            return f.getSelection(nestedContext);
        });

        const filterSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.filters, [nestedContext.target]);

        if (extraMatches.length > 0 || filterSubqueries.length > 0) {
            extraMatches = [matchClause, ...extraMatches];
            matchClause = new Cypher.With("*");
        }

        const filterPredicates = this.getPredicates(nestedContext);
        const authFilterSubqueries = this.getAuthFilterSubqueries(nestedContext);
        const authFiltersPredicate = this.getAuthFilterPredicate(nestedContext);

        const wherePredicate = Cypher.and(filterPredicates, ...authFiltersPredicate);
        if (wherePredicate) {
            matchClause.where(wherePredicate);
        }
        const cypherFieldSubqueries = this.getCypherFieldsSubqueries(nestedContext);
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(nestedContext), ...cypherFieldSubqueries);
        const ret = this.getProjectionClause(nestedContext, context.returnVariable);

        const clause = Cypher.concat(
            ...extraMatches,
            ...filterSubqueries,
            matchClause,
            ...authFilterSubqueries,
            subqueries,
            ret
        );

        return {
            clauses: [clause],
            projectionExpr: context.returnVariable,
        };
    }

    protected getProjectionClause(context: QueryASTContext, returnVariable: Cypher.Variable): Cypher.Return {
        if (!hasTarget(context)) throw new Error("No parent node found!");
        const projection = this.getProjectionMap(context);

        const targetNodeName = this.target.name;
        projection.set({
            __resolveType: new Cypher.Literal(targetNodeName),
            __id: Cypher.id(context.target),
        });

        const withClause = new Cypher.With([projection, context.target]);

        return withClause.return([context.target, returnVariable]);
    }
}

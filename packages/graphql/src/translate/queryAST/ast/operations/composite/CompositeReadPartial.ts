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
import { createNodeFromEntity, createRelationshipFromEntity } from "../../../utils/create-node-from-entity";
import { QueryASTContext } from "../../QueryASTContext";
import { ReadOperation } from "../ReadOperation";
import type { OperationTranspileResult } from "../operations";
import { UNION_UNIFICATION_ENABLED } from "../optimizationSettings";

export class CompositeReadPartial extends ReadOperation {
    public transpile(
        context: QueryASTContext,
        matchByInterfaceOrUnion?: string,
        exclusionPredicates?: (matchNode: Cypher.Node) => Cypher.Predicate[]
    ) {
        if (this.relationship) {
            return this.transpileNestedCompositeRelationship(
                this.relationship,
                context,
                matchByInterfaceOrUnion,
                exclusionPredicates
            );
        } else {
            return this.transpileTopLevelCompositeEntity(context);
        }
    }

    private transpileNestedCompositeRelationship(
        entity: RelationshipAdapter,
        context: QueryASTContext,
        matchByInterfaceOrUnion?: string,
        exclusionPredicates?: (matchNode: Cypher.Node) => Cypher.Predicate[]
    ): OperationTranspileResult {
        if (!hasTarget(context)) throw new Error("No parent node found!");
        const parentNode = context.target;
        const relVar = createRelationshipFromEntity(entity);
        const targetNode =
            matchByInterfaceOrUnion && context.neo4jGraphQLContext.labelManager
                ? new Cypher.Node({
                      labels: context.neo4jGraphQLContext.labelManager.getLabelSelectorExpressionObject(
                          matchByInterfaceOrUnion
                      ),
                  })
                : createNodeFromEntity(this.target, context.neo4jGraphQLContext);
        const relDirection = entity.getCypherDirection(this.directed);

        const pattern = new Cypher.Pattern(parentNode)
            .withoutLabels()
            .related(relVar)
            .withDirection(relDirection)
            .to(targetNode);

        const nestedContext = context.push({ target: targetNode, relationship: relVar });
        const { preSelection, selectionClause: matchClause } = this.getSelectionClauses(nestedContext, pattern);
        const filterPredicates = this.getPredicates(nestedContext);
        const authFilterSubqueries = this.getAuthFilterSubqueries(nestedContext);
        const authFiltersPredicate = this.getAuthFilterPredicate(nestedContext);

        const wherePredicate = Cypher.and(
            filterPredicates,
            ...authFiltersPredicate,
            ...(exclusionPredicates?.(targetNode) ?? [])
        );
        if (wherePredicate) {
            // NOTE: This is slightly different to ReadOperation for cypher compatibility, this could use `WITH *`
            matchClause.where(wherePredicate);
        }

        const cypherFieldSubqueries = this.getCypherFieldsSubqueries(nestedContext);
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(nestedContext), ...cypherFieldSubqueries);
        const sortSubqueries = this.sortFields
            .flatMap((sq) => sq.getSubqueries(nestedContext))
            .map((sq) => new Cypher.Call(sq).innerWith(targetNode));

        const ret = this.getProjectionClause(nestedContext, context.returnVariable);

        const clause = Cypher.concat(
            ...preSelection,
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
        const targetNode = createNodeFromEntity(this.target, context.neo4jGraphQLContext);
        const nestedContext = new QueryASTContext({
            target: targetNode,
            env: context.env,
            neo4jGraphQLContext: context.neo4jGraphQLContext,
        });
        const { preSelection, selectionClause: matchClause } = this.getSelectionClauses(nestedContext, targetNode);
        const filterPredicates = this.getPredicates(nestedContext);
        const authFilterSubqueries = this.getAuthFilterSubqueries(nestedContext);
        const authFiltersPredicate = this.getAuthFilterPredicate(nestedContext);

        const wherePredicate = Cypher.and(filterPredicates, ...authFiltersPredicate);
        if (wherePredicate) {
            matchClause.where(wherePredicate);
        }
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(nestedContext));
        const ret = this.getProjectionClause(nestedContext, context.returnVariable);

        const clause = Cypher.concat(...preSelection, matchClause, ...authFilterSubqueries, subqueries, ret);

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
            __resolveType:
                UNION_UNIFICATION_ENABLED && context.neo4jGraphQLContext.labelManager?.hasMainType(targetNodeName)
                    ? new Cypher.Property(context.target, "mainType")
                    : new Cypher.Literal(targetNodeName),
            __id: Cypher.id(context.target),
        });

        const withClause = new Cypher.With([projection, context.target]);

        return withClause.return([context.target, returnVariable]);
    }
}

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
import { createNodeFromEntity, createRelationshipFromEntity } from "../../../utils/create-node-from-entity";
import type { QueryASTContext } from "../../QueryASTContext";
import { ReadOperation } from "../ReadOperation";
import type { OperationTranspileOptions, OperationTranspileResult } from "../operations";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";

export class CompositeReadPartial extends ReadOperation {
    public transpile({ returnVariable, context }: OperationTranspileOptions): OperationTranspileResult {
        if (this.relationship) {
            return this.transpileNestedCompositeRelationship(this.relationship, { returnVariable, context });
        } else {
            throw new Error("Top level interfaces are not supported");
        }
    }

    private transpileNestedCompositeRelationship(
        entity: RelationshipAdapter,
        { returnVariable, context }: OperationTranspileOptions
    ): OperationTranspileResult {
        const parentNode = context.target;
        const relVar = createRelationshipFromEntity(entity);
        const targetNode = createNodeFromEntity(this.target);
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

        const wherePredicate = Cypher.and(filterPredicates, ...authFiltersPredicate);
        if (wherePredicate) {
            // NOTE: This is slightly different to ReadOperation for cypher compatibility, this could use `WITH *`
            matchClause.where(wherePredicate);
        }
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(nestedContext));
        const sortSubqueries = this.sortFields
            .flatMap((sq) => sq.getSubqueries(nestedContext))
            .map((sq) => new Cypher.Call(sq).innerWith(targetNode));

        const ret = this.getProjectionClause(nestedContext, returnVariable);

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
            projectionExpr: returnVariable,
        };
    }

    protected getProjectionClause(context: QueryASTContext, returnVariable: Cypher.Variable): Cypher.Return {
        const projection = this.getProjectionMap(context);

        const targetNodeName = this.target.name;
        projection.set({
            __resolveType: new Cypher.Literal(targetNodeName),
            __id: Cypher.id(context.source!), // NOTE: I think this is a bug and should be target
        });

        const withClause = new Cypher.With([projection, context.target]);

        return withClause.return([context.target, returnVariable]);
    }
}

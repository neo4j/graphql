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
import { QueryASTContext } from "../../QueryASTContext";
import { ReadOperation } from "../ReadOperation";
import type { OperationTranspileOptions, OperationTranspileResult } from "../operations";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";

export class InterfaceReadPartial extends ReadOperation {
    public transpile({ returnVariable, parentNode }: OperationTranspileOptions): OperationTranspileResult {
        if (this.relationship) {
            return this.transpileNestedInterfaceRelationship(this.relationship, { returnVariable, parentNode });
        } else {
            throw new Error("Top level interfaces are not supported");
        }
    }

    private transpileNestedInterfaceRelationship(
        entity: RelationshipAdapter,
        { returnVariable, parentNode }: OperationTranspileOptions
    ): OperationTranspileResult {
        //TODO: dupe from transpile
        if (!parentNode) throw new Error("No parent node found!");
        const relVar = createRelationshipFromEntity(entity);
        const targetNode = createNodeFromEntity(this.target);
        const relDirection = entity.getCypherDirection(this.directed);

        const pattern = new Cypher.Pattern(parentNode)
            .withoutLabels()
            .related(relVar)
            .withDirection(relDirection)
            .to(targetNode);

        const matchClause = new Cypher.Match(pattern);
        const nestedContext = new QueryASTContext({ target: targetNode, relationship: relVar, source: parentNode });
        const filterPredicates = this.getPredicates(nestedContext);
        const authFilterSubqueries = this.authFilters ? this.authFilters.getSubqueries(nestedContext) : [];
        const authFiltersPredicate = this.authFilters ? this.authFilters.getPredicate(nestedContext) : undefined;

        const wherePredicate = Cypher.and(filterPredicates, authFiltersPredicate);
        if (wherePredicate) {
            // NOTE: This is slightly different to ReadOperation for cypher compatibility, this could use `WITH *`
            matchClause.where(wherePredicate);
        }
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(nestedContext));
        const sortSubqueries = this.sortFields
            .flatMap((sq) => sq.getSubqueries(nestedContext))
            .map((sq) => new Cypher.Call(sq).innerWith(targetNode));

        const ret = this.getProjectionClause(nestedContext, returnVariable, entity.isList);

        const clause = Cypher.concat(
            matchClause,
            ...authFilterSubqueries,
            // withWhere,
            subqueries,
            ...sortSubqueries,
            ret
        );

        return {
            clauses: [clause],
            projectionExpr: returnVariable,
        };
    }

    protected getProjectionClause(
        context: QueryASTContext,
        returnVariable: Cypher.Variable,
        isArray: boolean
    ): Cypher.Return {
        const projection = this.getProjectionMap(context);

        const targetNodeName = this.target.name;
        projection.set({
            __resolveType: new Cypher.Literal(targetNodeName),
            __id: Cypher.id(context.source!), // NOTE: I think this is a bug and should be target
        });
        // let aggregationExpr: Cypher.Expr = Cypher.collect(context.target);
        // if (!isArray) {
        //     aggregationExpr = Cypher.head(aggregationExpr);
        // }

        const withClause = new Cypher.With([projection, context.target]);
        // if (this.sortFields.length > 0 || this.pagination) {
        //     this.addSortToClause(context, context.target, withClause);
        // }

        return withClause.return([context.target, returnVariable]);
    }
}

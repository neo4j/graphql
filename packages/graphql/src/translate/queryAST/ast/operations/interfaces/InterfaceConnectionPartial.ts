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
import { createNodeFromEntity } from "../../../utils/create-node-from-entity";
import { QueryASTContext } from "../../QueryASTContext";
import { ConnectionReadOperation } from "../ConnectionReadOperation";
import type { OperationTranspileOptions, OperationTranspileResult } from "../operations";

export class InterfaceConnectionPartial extends ConnectionReadOperation {
    public transpile({ returnVariable, parentNode }: OperationTranspileOptions): OperationTranspileResult {
        if (!parentNode) throw new Error();
        const node = createNodeFromEntity(this.target);
        const relationship = new Cypher.Relationship({ type: this.relationship.type });
        const relDirection = this.relationship.getCypherDirection(this.directed);

        const clause = new Cypher.Match(
            new Cypher.Pattern(parentNode).withoutLabels().related(relationship).withDirection(relDirection).to(node)
        );

        const nestedContext = new QueryASTContext({ target: node, relationship, source: parentNode });

        const predicates = this.filters.map((f) => f.getPredicate(nestedContext));
        const authPredicate = this.authFilters?.getPredicate(nestedContext);

        const authFilterSubqueries = this.authFilters?.getSubqueries(nestedContext) || [];

        const filters = Cypher.and(...predicates, authPredicate);

        const nodeProjectionSubqueries = this.nodeFields
            .flatMap((f) => f.getSubqueries(nestedContext))
            .map((sq) => new Cypher.Call(sq).innerWith(node));

        const nodeProjectionMap = new Cypher.Map();

        // THis bit is different than normal connection ops
        const targetNodeName = this.target.name;
        nodeProjectionMap.set({
            __resolveType: new Cypher.Literal(targetNodeName),
            __id: Cypher.id(node),
        });

        this.nodeFields
            .map((f) => f.getProjectionField(node))
            .forEach((p) => {
                if (typeof p === "string") {
                    nodeProjectionMap.set(p, node.property(p));
                } else {
                    nodeProjectionMap.set(p);
                }
            });

        const edgeVar = new Cypher.NamedVariable("edge");
        const edgesVar = new Cypher.NamedVariable("edges");
        const totalCount = new Cypher.NamedVariable("totalCount");

        const edgeProjectionMap = new Cypher.Map();

        this.edgeFields
            .map((f) => f.getProjectionField(relationship))
            .forEach((p) => {
                if (typeof p === "string") {
                    edgeProjectionMap.set(p, relationship.property(p));
                } else {
                    edgeProjectionMap.set(p);
                }
            });

        edgeProjectionMap.set("node", nodeProjectionMap);

        let withWhere: Cypher.Clause | undefined;
        if (filters) {
            if (authFilterSubqueries.length > 0) {
                // This is to avoid unnecessary With *
                withWhere = new Cypher.With("*").where(filters);
            } else {
                clause.where(filters);
            }
        }

        let sortSubquery: Cypher.With | undefined;
        if (this.pagination || this.sortFields.length > 0) {
            const paginationField = this.pagination && this.pagination.getPagination();

            sortSubquery = this.getPaginationSubquery(nestedContext, edgesVar, paginationField);
            sortSubquery.addColumns(totalCount);
        }

        let extraWithOrder: Cypher.Clause | undefined;
        if (this.sortFields.length > 0) {
            const sortFields = this.getSortFields(nestedContext, node, relationship);

            extraWithOrder = new Cypher.With(relationship, node).orderBy(...sortFields);
        }

        const projectionClauses = new Cypher.With([edgeProjectionMap, edgeVar]).return(returnVariable);

        const subClause = Cypher.concat(
            clause,
            ...authFilterSubqueries,
            withWhere,
            extraWithOrder,
            ...nodeProjectionSubqueries,
            projectionClauses
        );

        return {
            clauses: [subClause],
            projectionExpr: returnVariable,
        };
    }
}

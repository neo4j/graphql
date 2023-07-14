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

import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../../schema-model/relationship/Relationship";
import { createNodeFromEntity } from "../../utils/create-node-from-entity";
import { getRelationshipDirection } from "../../utils/get-relationship-direction";
import type { Field } from "../fields/Field";
import type { Filter } from "../filters/Filter";
import Cypher from "@neo4j/cypher-builder";
import type { OperationTranspileOptions } from "./operations";
import { Operation } from "./operations";
import type { Pagination, PaginationField } from "../pagination/Pagination";
import type { ConnectionSort } from "../sort/ConnectionSort";
import type { QueryASTNode } from "../QueryASTNode";
import { QueryASTContext } from "../QueryASTNode";
import { filterTruthy } from "../../../../utils/utils";

export class ConnectionReadOperation extends Operation {
    public readonly relationship: Relationship;

    public nodeFields: Field[] = [];
    public edgeFields: Field[] = [];

    private nodeFilters: Filter[] = [];
    private edgeFilters: Filter[] = [];

    private pagination: Pagination | undefined;
    private sortFields: ConnectionSort | undefined;

    constructor(relationship: Relationship) {
        super();
        this.relationship = relationship;
    }

    public get children(): QueryASTNode[] {
        return filterTruthy([
            ...this.nodeFields,
            ...this.edgeFields,
            ...this.nodeFilters,
            ...this.edgeFilters,
            this.pagination,
            this.sortFields,
        ]);
    }

    public setNodeFields(fields: Field[]) {
        this.nodeFields = fields;
    }
    public setNodeFilters(filters: Filter[]) {
        this.nodeFilters = filters;
    }

    public setEdgeFilters(filters: Filter[]) {
        this.edgeFilters = filters;
    }

    public setEdgeFields(fields: Field[]) {
        this.edgeFields = fields;
    }

    public addSort(sort: ConnectionSort): void {
        this.sortFields = sort;
    }

    public addPagination(pagination: Pagination): void {
        this.pagination = pagination;
    }

    public transpile({ returnVariable, parentNode }: OperationTranspileOptions): Cypher.Clause {
        if (!parentNode) throw new Error();
        const node = createNodeFromEntity(this.relationship.target as ConcreteEntity);
        const relationship = new Cypher.Relationship({ type: this.relationship.type });
        const relDirection = getRelationshipDirection(this.relationship);
        const clause = new Cypher.Match(
            new Cypher.Pattern(parentNode).withoutLabels().related(relationship).withDirection(relDirection).to(node)
        );

        const filterPredicates = Cypher.and(...this.nodeFilters.map((f) => f.getPredicate(node)));
        const edgeFilterPredicates = Cypher.and(...this.edgeFilters.map((f) => (f as any).getPredicate(relationship))); // Any because of relationship predicates

        const nodeProjectionMap = new Cypher.Map();
        this.nodeFields
            .map((f) => f.getProjectionField(node))
            .forEach((p) => {
                if (typeof p === "string") {
                    nodeProjectionMap.set(p, node.property(p));
                } else {
                    nodeProjectionMap.set(p);
                }
            });

        if (nodeProjectionMap.size === 0) {
            const targetNodeName = this.relationship.target.name;
            nodeProjectionMap.set({
                __resolveType: new Cypher.Literal(targetNodeName),
                __id: Cypher.id(node),
            });
        }

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
        if (edgeFilterPredicates) {
            clause.where(edgeFilterPredicates);
        }
        if (filterPredicates) {
            clause.where(filterPredicates);
        }

        let sortSubquery: Cypher.With | undefined;
        if (this.pagination || this.sortFields) {
            const paginationField = this.pagination && this.pagination.getPagination();

            // if (paginationField) {
            sortSubquery = this.getPaginationSubquery(
                edgesVar,
                paginationField,
                new QueryASTContext({
                    parentNode,
                    targetNode: node,
                    edge: relationship,
                })
            );
            sortSubquery.addColumns(totalCount);
            // }
        }

        let extraWithOrder: Cypher.Clause | undefined;
        if (this.sortFields) {
            const sortFields =
                this.sortFields?.transpile(
                    new QueryASTContext({
                        parentNode,
                        targetNode: node,
                        edge: relationship,
                    })
                ).sortFields || [];
            extraWithOrder = new Cypher.With(relationship, node).orderBy(...sortFields);
        }

        const projectionClauses = new Cypher.With([edgeProjectionMap, edgeVar])
            .with([Cypher.collect(edgeVar), edgesVar])
            .with(edgesVar, [Cypher.size(edgesVar), totalCount]);

        const returnClause = new Cypher.Return([
            new Cypher.Map({
                edges: edgesVar,
                totalCount: totalCount,
            }),
            returnVariable,
        ]);
        return Cypher.concat(clause, extraWithOrder, projectionClauses, sortSubquery, returnClause);
    }

    private getPaginationSubquery(
        edgesVar: Cypher.Variable,
        paginationField: PaginationField | undefined,
        ctx: QueryASTContext
    ): Cypher.With {
        const edgeVar = new Cypher.NamedVariable("edge");

        const sortFields =
            this.sortFields?.transpile(
                ctx.push({
                    parentNode: ctx.varMap.parentNode,
                    targetNode: edgeVar.property("node") as any,
                    edge: edgeVar as any,
                })
            ).sortFields || [];

        const subquery = new Cypher.Unwind([edgesVar, edgeVar]).with(edgeVar);

        subquery.orderBy(...sortFields);
        if (paginationField && paginationField.limit) {
            subquery.limit(paginationField.limit as any);
        }

        const returnVar = new Cypher.Variable();
        subquery.return([Cypher.collect(edgeVar), returnVar]);

        return new Cypher.Call(subquery).innerWith(edgesVar).with([returnVar, edgesVar]);
    }
}

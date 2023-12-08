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
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { filterTruthy } from "../../../../utils/utils";
import { hasTarget } from "../../utils/context-has-target";
import { wrapSubqueriesInCypherCalls } from "../../utils/wrap-subquery-in-calls";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { Field } from "../fields/Field";
import { CypherAttributeField } from "../fields/attribute-fields/CypherAttributeField";
import type { Filter } from "../filters/Filter";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { Pagination } from "../pagination/Pagination";
import type { EntitySelection } from "../selection/EntitySelection";
import { CypherPropertySort } from "../sort/CypherPropertySort";
import type { Sort, SortField } from "../sort/Sort";
import type { OperationTranspileResult } from "./operations";
import { Operation } from "./operations";

export class ConnectionReadOperation extends Operation {
    public readonly relationship: RelationshipAdapter | undefined;
    public readonly target: ConcreteEntityAdapter;

    protected directed: boolean;
    public nodeFields: Field[] = [];
    public edgeFields: Field[] = []; // TODO: merge with attachedTo?
    protected filters: Filter[] = [];
    protected pagination: Pagination | undefined;
    protected sortFields: Array<{ node: Sort[]; edge: Sort[] }> = [];
    protected authFilters: AuthorizationFilters[] = [];
    public nodeAlias: string | undefined; // This is just to maintain naming with the old way (this), remove after refactor

    protected selection: EntitySelection;

    constructor({
        relationship,
        directed,
        target,
        selection,
    }: {
        relationship: RelationshipAdapter | undefined;
        target: ConcreteEntityAdapter;
        directed: boolean;
        selection: EntitySelection;
    }) {
        super();
        this.relationship = relationship;
        this.directed = directed;
        this.target = target;
        this.selection = selection;
    }

    public setNodeFields(fields: Field[]) {
        this.nodeFields = fields;
    }

    public addFilters(...filters: Filter[]) {
        this.filters.push(...filters);
    }

    public setEdgeFields(fields: Field[]) {
        this.edgeFields = fields;
    }

    public addAuthFilters(...filter: AuthorizationFilters[]) {
        this.authFilters.push(...filter);
    }

    public addSort(sortElement: { node: Sort[]; edge: Sort[] }): void {
        this.sortFields.push(sortElement);
    }

    public addPagination(pagination: Pagination): void {
        this.pagination = pagination;
    }

    public getChildren(): QueryASTNode[] {
        const sortFields = this.sortFields.flatMap((s) => {
            return [...s.edge, ...s.node];
        });

        return filterTruthy([
            ...this.nodeFields,
            ...this.edgeFields,
            ...this.filters,
            ...this.authFilters,
            this.pagination,
            ...sortFields,
        ]);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.target) throw new Error();

        // eslint-disable-next-line prefer-const
        let { selection: selectionClause, nestedContext } = this.selection.apply(context);

        let extraMatches: Array<Cypher.Match | Cypher.With | Cypher.Yield> = this.getChildren().flatMap((f) => {
            return f.getSelection(nestedContext);
        });

        if (extraMatches.length > 0) {
            extraMatches = [selectionClause, ...extraMatches];
            selectionClause = new Cypher.With("*");
        }

        const authFilterSubqueries = this.getAuthFilterSubqueries(nestedContext).map((sq) =>
            new Cypher.Call(sq).innerWith(nestedContext.target)
        );

        const { prePaginationSubqueries, postPaginationSubqueries } = this.getPreAndPostSubqueries(nestedContext);

        let withWhere: Cypher.Clause | undefined;

        const predicates = this.filters.map((f) => f.getPredicate(nestedContext));
        const authPredicate = this.getAuthFilterPredicate(nestedContext);
        const filters = Cypher.and(...predicates, ...authPredicate);
        if (filters) {
            if (authFilterSubqueries.length > 0) {
                // This is to avoid unnecessary With *
                withWhere = new Cypher.With("*").where(filters);
            } else {
                selectionClause.where(filters);
            }
        }

        const edgeVar = new Cypher.NamedVariable("edge");
        const edgesVar = new Cypher.NamedVariable("edges");
        const totalCount = new Cypher.NamedVariable("totalCount");

        const edgeMap1 = new Cypher.Map({
            node: nestedContext.target,
        });

        if (nestedContext.relationship) {
            edgeMap1.set("relationship", nestedContext.relationship);
        }

        const withNodeAndTotalCount = new Cypher.With([Cypher.collect(edgeMap1), edgesVar]).with(edgesVar, [
            Cypher.size(edgesVar),
            totalCount,
        ]);

        let paginationWith: Cypher.With | undefined;
        if (this.pagination || this.sortFields.length > 0) {
            paginationWith = new Cypher.With("*");
            const paginationField = this.pagination && this.pagination.getPagination();
            if (paginationField?.limit) {
                paginationWith.limit(paginationField.limit);
            }
            if (paginationField?.skip) {
                paginationWith.skip(paginationField.skip);
            }
            if (this.sortFields.length > 0) {
                const sortFields = this.getSortFields({
                    context: nestedContext,
                    nodeVar: nestedContext.target,
                    edgeVar: nestedContext.relationship,
                });
                paginationWith.orderBy(...sortFields);
            }
        }

        const edgesVar2 = new Cypher.Variable();
        let unwindClause: Cypher.With;
        if (nestedContext.relationship) {
            unwindClause = new Cypher.Unwind([edgesVar, edgeVar]).with(
                [edgeVar.property("node"), nestedContext.target],
                [edgeVar.property("relationship"), nestedContext.relationship]
            );
        } else {
            unwindClause = new Cypher.Unwind([edgesVar, edgeVar]).with([
                edgeVar.property("node"),
                nestedContext.target,
            ]);
        }

        const nodeProjectionMap = new Cypher.Map();

        const edgeProjectionMap = new Cypher.Map();
        const relationship = nestedContext.relationship;
        if (relationship) {
            this.edgeFields
                .map((f) => f.getProjectionField(relationship))
                .forEach((p) => {
                    if (typeof p === "string") {
                        edgeProjectionMap.set(p, relationship.property(p));
                    } else {
                        edgeProjectionMap.set(p);
                    }
                });
        }

        this.nodeFields
            .map((f) => f.getProjectionField(nestedContext.target))
            .forEach((p) => {
                if (typeof p === "string") {
                    nodeProjectionMap.set(p, nestedContext.target.property(p));
                } else {
                    nodeProjectionMap.set(p);
                }
            });

        if (nodeProjectionMap.size === 0) {
            const targetNodeName = this.target.name;
            nodeProjectionMap.set({
                __resolveType: new Cypher.Literal(targetNodeName),
                __id: Cypher.id(nestedContext.target),
            });
        }

        edgeProjectionMap.set("node", nodeProjectionMap);

        const withProjection = new Cypher.With([edgeProjectionMap, edgeVar]).with([Cypher.collect(edgeVar), edgesVar]);

        const unwindAndProjectionSubquery = new Cypher.Call(
            Cypher.concat(
                unwindClause,
                ...prePaginationSubqueries,
                paginationWith,
                ...postPaginationSubqueries,
                withProjection,
                new Cypher.Return([edgesVar, edgesVar2])
            )
        ).innerWith(edgesVar);

        const returnClause = new Cypher.Return([
            new Cypher.Map({
                edges: edgesVar2,
                totalCount: totalCount,
            }),
            context.returnVariable,
        ]);

        const subClause = Cypher.concat(
            ...extraMatches,
            selectionClause,
            ...authFilterSubqueries,
            withWhere,
            withNodeAndTotalCount,
            unwindAndProjectionSubquery,
            returnClause
        );

        return {
            clauses: [subClause],
            projectionExpr: context.returnVariable,
        };
    }

    protected getAuthFilterSubqueries(context: QueryASTContext): Cypher.Clause[] {
        return this.authFilters.flatMap((f) => f.getSubqueries(context));
    }

    protected getAuthFilterPredicate(context: QueryASTContext): Cypher.Predicate[] {
        return filterTruthy(this.authFilters.map((f) => f.getPredicate(context)));
    }

    private getSortFields({
        context,
        nodeVar,
        edgeVar,
    }: {
        context: QueryASTContext;
        nodeVar: Cypher.Variable | Cypher.Property;
        edgeVar?: Cypher.Variable | Cypher.Property;
    }): SortField[] {
        const aliasSort = true;
        return this.sortFields.flatMap(({ node, edge }) => {
            const nodeFields = node.flatMap((s) => s.getSortFields(context, nodeVar, aliasSort));
            if (edgeVar) {
                const edgeFields = edge.flatMap((s) => s.getSortFields(context, edgeVar, aliasSort));
                return [...nodeFields, ...edgeFields];
            }
            return nodeFields;
        });
    }

    private getPreAndPostSubqueries(context: QueryASTContext): {
        prePaginationSubqueries: Cypher.Clause[];
        postPaginationSubqueries: Cypher.Clause[];
    } {
        if (!hasTarget(context)) throw new Error("No parent node found!");
        const sortNodeFields = this.sortFields.flatMap((sf) => sf.node);
        const cypherSortFieldsFlagMap = sortNodeFields.reduce<Record<string, boolean>>(
            (sortFieldsFlagMap, sortField) => {
                if (sortField instanceof CypherPropertySort) {
                    sortFieldsFlagMap[sortField.getFieldName()] = true;
                }
                return sortFieldsFlagMap;
            },
            {}
        );

        const preAndPostFields = this.nodeFields.reduce<Record<"Pre" | "Post", Field[]>>(
            (acc, nodeField) => {
                if (nodeField instanceof CypherAttributeField && cypherSortFieldsFlagMap[nodeField.getFieldName()]) {
                    acc.Pre.push(nodeField);
                } else {
                    acc.Post.push(nodeField);
                }
                return acc;
            },
            { Pre: [], Post: [] }
        );
        const preNodeSubqueries = wrapSubqueriesInCypherCalls(context, preAndPostFields.Pre, [context.target]);
        const postNodeSubqueries = wrapSubqueriesInCypherCalls(context, preAndPostFields.Post, [context.target]);
        const sortSubqueries = wrapSubqueriesInCypherCalls(context, sortNodeFields, [context.target]);

        return {
            prePaginationSubqueries: [...sortSubqueries, ...preNodeSubqueries],
            postPaginationSubqueries: postNodeSubqueries,
        };
    }
}

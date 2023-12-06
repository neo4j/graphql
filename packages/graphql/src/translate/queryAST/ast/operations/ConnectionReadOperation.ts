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
import type { Pagination, PaginationField } from "../pagination/Pagination";
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

    protected getAuthFilterSubqueries(context: QueryASTContext): Cypher.Clause[] {
        return this.authFilters.flatMap((f) => f.getSubqueries(context));
    }

    protected getAuthFilterPredicate(context: QueryASTContext): Cypher.Predicate[] {
        return filterTruthy(this.authFilters.map((f) => f.getPredicate(context)));
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

    protected getSelectionClauses(
        context: QueryASTContext,
        node: Cypher.Node | Cypher.Pattern
    ): {
        preSelection: Array<Cypher.Match | Cypher.With>;
        selectionClause: Cypher.Match | Cypher.With;
    } {
        let matchClause: Cypher.Match | Cypher.With = new Cypher.Match(node);

        let extraMatches = this.getChildren().flatMap((f) => {
            return f.getSelection(context);
        });

        if (extraMatches.length > 0) {
            extraMatches = [matchClause, ...extraMatches];
            matchClause = new Cypher.With("*");
        }

        return {
            preSelection: extraMatches,
            selectionClause: matchClause,
        };
    }

    private transpileNested(context: QueryASTContext): OperationTranspileResult {
        if (!context.target || !this.relationship) throw new Error();

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
        const predicates = this.filters.map((f) => f.getPredicate(nestedContext));
        const authPredicate = this.getAuthFilterPredicate(nestedContext);
        const filters = Cypher.and(...predicates, ...authPredicate);

        // Specific but compatible

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

        // NOT compatible
        const nodeProjectionSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.nodeFields, [
            nestedContext.target,
        ]);

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

        const edgeVar = new Cypher.NamedVariable("edge");
        const edgesVar = new Cypher.NamedVariable("edges");
        const totalCount = new Cypher.NamedVariable("totalCount");

        let withWhere: Cypher.Clause | undefined;
        if (filters) {
            if (authFilterSubqueries.length > 0) {
                // This is to avoid unnecessary With *
                withWhere = new Cypher.With("*").where(filters);
            } else {
                selectionClause.where(filters);
            }
        }
        // Common transpile ends

        // Pagination is different
        let sortSubquery: Cypher.With | undefined;
        if (this.pagination || this.sortFields.length > 0) {
            const paginationField = this.pagination && this.pagination.getPagination();

            sortSubquery = this.getPaginationSubquery(nestedContext, edgesVar, paginationField);
            sortSubquery.addColumns(totalCount);
        }

        let extraWithOrder: Cypher.Clause | undefined;
        if (this.sortFields.length > 0) {
            const sortFields = this.getSortFields({
                context: nestedContext,
                nodeVar: nestedContext.target,
                edgeVar: relationship,
            });

            const orderWithItems = relationship ? [relationship, nestedContext.target] : [nestedContext.target];

            extraWithOrder = new Cypher.With(...orderWithItems).orderBy(...sortFields);
        }

        // Projection is different
        const projectionClauses = new Cypher.With([edgeProjectionMap, edgeVar])
            .with([Cypher.collect(edgeVar), edgesVar])
            .with(edgesVar, [Cypher.size(edgesVar), totalCount]);

        // Common Return
        const returnClause = new Cypher.Return([
            new Cypher.Map({
                edges: edgesVar,
                totalCount: totalCount,
            }),
            context.returnVariable,
        ]);
        const subClause = Cypher.concat(
            ...extraMatches,
            selectionClause,
            ...authFilterSubqueries,
            withWhere,
            extraWithOrder,
            ...nodeProjectionSubqueries,
            projectionClauses,
            sortSubquery,
            returnClause
        );

        return {
            clauses: [subClause],
            projectionExpr: context.returnVariable,
        };
    }

    private transpileTopLevel(context: QueryASTContext): OperationTranspileResult {
        if (!hasTarget(context)) {
            throw new Error("No parent node found!");
        }

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
        const predicates = this.filters.map((f) => f.getPredicate(nestedContext));
        const authPredicate = this.getAuthFilterPredicate(nestedContext);
        const filters = Cypher.and(...predicates, ...authPredicate);
        // Specific but compatible

        const nodeProjectionMap = new Cypher.Map();

        // const nodeProjectionSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.nodeFields, [
        //     nestedContext.target,
        // ]);

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

        // // NOTE: this is not compatible, but required due to transpile being called before projectionField
        const { prePaginationSubqueries, postPaginationSubqueries } = this.getPreAndPostSubqueries(nestedContext);

        //Nested version:
        // const nodeProjectionSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.nodeFields, [
        //     nestedContext.target,
        // ]);

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

        const edgeVar = new Cypher.NamedVariable("edge");
        const edgesVar = new Cypher.NamedVariable("edges");
        const totalCount = new Cypher.NamedVariable("totalCount");

        let withWhere: Cypher.Clause | undefined;
        if (filters) {
            if (authFilterSubqueries.length > 0) {
                // This is to avoid unnecessary With *
                withWhere = new Cypher.With("*").where(filters);
            } else {
                selectionClause.where(filters);
            }
        }
        const withNodeAndTotalCount = new Cypher.With([Cypher.collect(nestedContext.target), edgesVar]).with(edgesVar, [
            Cypher.size(edgesVar),
            totalCount,
        ]);
        // Common transpile ends

        // Pagination is different
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
                    aliased: true,
                });
                paginationWith.orderBy(...sortFields);
            }
        }

        // Projection is different
        const unwindClause = new Cypher.Unwind([edgesVar, nestedContext.target]).with(nestedContext.target, totalCount);
        const withProjection = new Cypher.With([edgeProjectionMap, edgeVar], totalCount, nestedContext.target).with(
            [Cypher.collect(edgeVar), edgesVar],
            totalCount
        );

        // Common Return
        const returnClause = new Cypher.Return([
            new Cypher.Map({
                edges: edgesVar,
                totalCount: totalCount,
            }),
            context.returnVariable,
        ]);

        const clause = Cypher.concat(
            ...extraMatches,
            selectionClause,
            ...authFilterSubqueries,
            withWhere,
            withNodeAndTotalCount,
            unwindClause,
            ...prePaginationSubqueries,
            paginationWith,
            ...postPaginationSubqueries,
            withProjection,
            returnClause
        );

        return {
            clauses: [clause],
            projectionExpr: context.returnVariable,
        };
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (this.relationship) {
            return this.transpileNested(context);
        } else {
            return this.transpileTopLevel(context);
        }
    }

    protected getPaginationSubquery(
        context: QueryASTContext,
        edgesVar: Cypher.Variable,
        paginationField: PaginationField | undefined
    ): Cypher.With {
        const edgeVar = new Cypher.NamedVariable("edge");
        const subquery = new Cypher.Unwind([edgesVar, edgeVar]).with(edgeVar);
        if (this.sortFields.length > 0) {
            const sortFields = this.getSortFields({ context, nodeVar: edgeVar.property("node"), edgeVar });
            subquery.orderBy(...sortFields);
        }

        if (paginationField && paginationField.skip) {
            subquery.skip(paginationField.skip);
        }

        if (paginationField && paginationField.limit) {
            subquery.limit(paginationField.limit);
        }

        const returnVar = new Cypher.Variable();
        subquery.return([Cypher.collect(edgeVar), returnVar]);

        return new Cypher.Call(subquery).innerWith(edgesVar).with([returnVar, edgesVar]);
    }

    protected getSortFields({
        context,
        nodeVar,
        edgeVar,
        aliased = false,
    }: {
        context: QueryASTContext;
        nodeVar: Cypher.Variable | Cypher.Property;
        edgeVar?: Cypher.Variable | Cypher.Property;
        aliased?: boolean;
    }): SortField[] {
        return this.sortFields.flatMap(({ node, edge }) => {
            const nodeFields = node.flatMap((s) => s.getSortFields(context, nodeVar, aliased));
            if (edgeVar) {
                const edgeFields = edge.flatMap((s) => s.getSortFields(context, edgeVar, aliased));
                return [...nodeFields, ...edgeFields];
            }
            return nodeFields;
        });
    }

    protected getPreAndPostSubqueries(context: QueryASTContext): {
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

    protected getProjectionMap(context: QueryASTContext): Cypher.MapProjection {
        if (!hasTarget(context)) throw new Error("No parent node found!");
        const projectionFields = this.nodeFields.map((f) => f.getProjectionField(context.target));
        const sortProjectionFields = this.sortFields.flatMap((f) =>
            f.node.map((sortNode) => sortNode.getProjectionField(context))
        );

        const uniqueProjectionFields = Array.from(new Set([...projectionFields, ...sortProjectionFields])); // TODO remove duplicates with alias

        const stringFields: string[] = [];
        let otherFields: Record<string, Cypher.Expr> = {};

        for (const field of uniqueProjectionFields) {
            if (typeof field === "string") stringFields.push(field);
            else {
                otherFields = { ...otherFields, ...field };
            }
        }

        return new Cypher.MapProjection(context.target, stringFields, otherFields);
    }
}

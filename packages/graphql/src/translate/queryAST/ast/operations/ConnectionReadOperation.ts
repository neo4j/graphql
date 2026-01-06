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
import { wrapSubqueriesInCypherCalls } from "../../utils/wrap-subquery-in-calls";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { ConnectionAggregationField } from "../fields/ConnectionAggregationField";
import type { Field } from "../fields/Field";
import { OperationField } from "../fields/OperationField";
import type { Filter } from "../filters/Filter";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { Pagination } from "../pagination/Pagination";
import type { EntitySelection } from "../selection/EntitySelection";
import type { Sort, SortField } from "../sort/Sort";
import { CypherAttributeOperation } from "./CypherAttributeOperation";
import type { OperationTranspileResult } from "./operations";
import { Operation } from "./operations";

export class ConnectionReadOperation extends Operation {
    public readonly relationship: RelationshipAdapter | undefined;
    public readonly target: ConcreteEntityAdapter;

    public nodeFields: Field[] = [];
    public edgeFields: Field[] = []; // TODO: merge with attachedTo?
    public filters: Filter[] = [];
    public skipConnection: boolean = false; // If set to true, skips the connection (use for aggregation only queries optimisation)

    protected pagination: Pagination | undefined;
    protected sortFields: Array<{ node: Sort[]; edge: Sort[] }> = [];
    protected authFilters: AuthorizationFilters[] = [];
    protected needsPageInfo: boolean = false;
    protected selection: EntitySelection;

    private hasTotalCount = false;
    private aggregationField: ConnectionAggregationField | undefined;

    constructor({
        relationship,
        target,
        selection,
    }: {
        relationship: RelationshipAdapter | undefined;
        target: ConcreteEntityAdapter;
        selection: EntitySelection;
    }) {
        super();
        this.relationship = relationship;
        this.target = target;
        this.selection = selection;
    }

    public setHasTotalCount(value: boolean): void {
        this.hasTotalCount = value;
    }

    public setNeedsPageInfo(value: boolean): void {
        this.needsPageInfo = value;
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

    /** Sets the aggregation field and adds the needed filters */
    public setAggregationField(aggregationField: ConnectionAggregationField): void {
        this.aggregationField = aggregationField;
    }

    public getChildren(): QueryASTNode[] {
        const sortFields = this.sortFields.flatMap((s) => {
            return [...s.edge, ...s.node];
        });

        return filterTruthy([
            this.selection,
            ...this.nodeFields,
            ...this.edgeFields,
            this.aggregationField,
            ...this.filters,
            ...this.authFilters,
            this.pagination,
            ...sortFields,
        ]);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error(
                "Error generating query: context has no target in ConnectionReadOperation. This is likely a bug with the @neo4j/graphql library"
            );
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

        const authFilterSubqueries = this.getAuthFilterSubqueries(nestedContext).map((sq) => {
            return new Cypher.Call(sq, filterTruthy([nestedContext.target, nestedContext.relationship]));
        });

        const normalFilterSubqueries = this.getFilterSubqueries(nestedContext).map((sq) => {
            return new Cypher.Call(sq, filterTruthy([nestedContext.target, nestedContext.relationship]));
        });

        const filtersSubqueries = [...authFilterSubqueries, ...normalFilterSubqueries];

        // Only add the import if it is nested
        const isTopLevel = !this.relationship;

        const aggregationSubqueries = (this.aggregationField?.getSubqueries(context) ?? []).map((sq) => {
            if (!isTopLevel) {
                return new Cypher.Call(sq, [context.target]);
            } else {
                return new Cypher.Call(sq);
            }
        });

        const aggregationProjection = this.aggregationField?.getProjectionField() ?? {};

        const edgesVar = new Cypher.NamedVariable("edges");
        const totalCount = new Cypher.NamedVariable("totalCount");
        const edgesProjectionVar = new Cypher.Variable();

        if (this.skipConnection) {
            const returnClause = new Cypher.Return([
                new Cypher.Map({
                    ...aggregationProjection,
                }),
                context.returnVariable,
            ]);

            return {
                clauses: [Cypher.utils.concat(...aggregationSubqueries, returnClause)],
                projectionExpr: context.returnVariable,
            };
        }

        const hasProjectionFields = this.shouldProjectEdges();
        let unwindAndProjectionSubquery: Cypher.Call | undefined;
        if (hasProjectionFields) {
            const edgeVar = new Cypher.NamedVariable("edge");
            const { prePaginationSubqueries, postPaginationSubqueries } =
                this.getPreAndPostPaginationSubqueries(nestedContext);

            const unwindClause = this.getUnwindClause(nestedContext, edgeVar, edgesVar);

            const edgeProjectionMap = this.createProjectionMapForEdge(nestedContext);
            const paginationWith = this.generateSortAndPaginationClause(nestedContext);

            unwindAndProjectionSubquery = new Cypher.Call(
                Cypher.utils.concat(
                    unwindClause,
                    ...prePaginationSubqueries,
                    paginationWith,
                    ...postPaginationSubqueries,
                    new Cypher.Return([Cypher.collect(edgeProjectionMap), edgesProjectionVar])
                ),
                [edgesVar]
            );
        }

        let withWhere: Cypher.With | undefined;

        if (filtersSubqueries.length > 0) {
            withWhere = new Cypher.With("*");
            this.addFiltersToClause(withWhere, nestedContext);
        } else {
            this.addFiltersToClause(selectionClause, nestedContext);
        }
        const withCollectEdgesAndTotalCount = this.getWithCollectEdgesAndTotalCount(
            nestedContext,
            edgesVar,
            totalCount
        );

        const projectionMap = new Cypher.Map();

        if (hasProjectionFields) {
            projectionMap.set("edges", edgesProjectionVar);
        }

        if (this.hasTotalCount) {
            projectionMap.set("totalCount", totalCount);
        }

        projectionMap.set({
            ...aggregationProjection,
        });

        const returnClause = new Cypher.Return([projectionMap, context.returnVariable]);
        const validations = this.getValidations(nestedContext);
        let connectionClauses: Cypher.Clause = Cypher.utils.concat(
            ...extraMatches,
            selectionClause,
            ...filtersSubqueries,
            withWhere,
            ...validations,
            withCollectEdgesAndTotalCount,
            unwindAndProjectionSubquery
        );

        if (aggregationSubqueries.length > 0) {
            const returnClause = new Cypher.Return(edgesProjectionVar);
            if (this.hasTotalCount) {
                returnClause.addColumns(totalCount);
            }

            connectionClauses = new Cypher.Call(Cypher.utils.concat(connectionClauses, returnClause), "*"); // NOTE: this call is only needed when aggregate is used
        }

        return {
            clauses: [Cypher.utils.concat(...aggregationSubqueries, connectionClauses, returnClause)],
            projectionExpr: context.returnVariable,
        };
    }

    protected getWithCollectEdgesAndTotalCount(
        nestedContext: QueryASTContext<Cypher.Node>,
        edgesVar: Cypher.Variable,
        totalCount: Cypher.Variable,
        extraColumns: Array<[Cypher.Expr, Cypher.Variable]> = []
    ): Cypher.With {
        const nodeAndRelationshipMap = new Cypher.Map({
            node: nestedContext.target,
        });

        if (nestedContext.relationship) {
            nodeAndRelationshipMap.set("relationship", nestedContext.relationship);
        }

        const withClause = new Cypher.With();
        if (this.shouldProjectEdges()) {
            withClause.addColumns([Cypher.collect(nodeAndRelationshipMap), edgesVar]);
        }
        withClause.addColumns(...extraColumns);

        if (this.hasTotalCount) {
            withClause.addColumns([Cypher.count(nestedContext.target), totalCount]);
        }
        return withClause;
    }

    /** Defines if the query should project edges */
    protected shouldProjectEdges(): boolean {
        const hasFields = this.nodeFields.length + this.edgeFields.length > 0;

        // Project edges when there are explicit node/edge projection fields or when pageInfo is requested.
        return hasFields || this.needsPageInfo;
    }

    protected getAuthFilterSubqueries(context: QueryASTContext): Cypher.Clause[] {
        return this.authFilters.flatMap((f) => f.getSubqueries(context));
    }

    protected getFilterSubqueries(context: QueryASTContext): Cypher.Clause[] {
        return this.filters.flatMap((f) => f.getSubqueries(context));
    }

    protected getAuthFilterPredicate(context: QueryASTContext): Cypher.Predicate[] {
        return filterTruthy(this.authFilters.map((f) => f.getPredicate(context)));
    }

    protected getValidations(context: QueryASTContext): Cypher.VoidProcedure[] {
        return filterTruthy(this.authFilters.flatMap((f) => f.getValidation(context)));
    }

    protected getUnwindClause(
        context: QueryASTContext<Cypher.Node>,
        edgeVar: Cypher.Variable,
        edgesVar: Cypher.Variable
    ): Cypher.With {
        let unwindClause: Cypher.With;
        if (context.relationship) {
            unwindClause = new Cypher.Unwind([edgesVar, edgeVar]).with(
                [edgeVar.property("node"), context.target],
                [edgeVar.property("relationship"), context.relationship]
            );
        } else {
            unwindClause = new Cypher.Unwind([edgesVar, edgeVar]).with([edgeVar.property("node"), context.target]);
        }
        return unwindClause;
    }

    protected createProjectionMapForNode(context: QueryASTContext<Cypher.Node>): Cypher.Map {
        const projectionMap = this.generateProjectionMapForFields(this.nodeFields, context.target);
        if (projectionMap.size === 0) {
            projectionMap.set({
                __id: Cypher.id(context.target),
            });
        }
        projectionMap.set({
            __resolveType: new Cypher.Literal(this.target.name),
        });
        return projectionMap;
    }

    protected addProjectionMapForRelationshipProperties(
        context: QueryASTContext<Cypher.Node>,
        edgeProjectionMap: Cypher.Map
    ): void {
        if (context.relationship) {
            const propertiesProjectionMap = this.generateProjectionMapForFields(this.edgeFields, context.relationship);
            if (propertiesProjectionMap.size) {
                if (this.relationship?.propertiesTypeName) {
                    // should be true if getting here but just in case..
                    propertiesProjectionMap.set(
                        "__resolveType",
                        new Cypher.Literal(this.relationship.propertiesTypeName)
                    );
                }
                edgeProjectionMap.set("properties", propertiesProjectionMap);
            }
        }
    }

    protected createProjectionMapForEdge(context: QueryASTContext<Cypher.Node>): Cypher.Map {
        const edgeProjectionMap = new Cypher.Map();
        this.addProjectionMapForRelationshipProperties(context, edgeProjectionMap);

        edgeProjectionMap.set("node", this.createProjectionMapForNode(context));
        return edgeProjectionMap;
    }

    protected generateProjectionMapForFields(fields: Field[], target: Cypher.Variable): Cypher.Map {
        const projectionMap = new Cypher.Map();
        fields
            .map((f) => f.getProjectionField(target))
            .forEach((p) => {
                if (typeof p === "string") {
                    projectionMap.set(p, target.property(p));
                } else {
                    projectionMap.set(p);
                }
            });

        return projectionMap;
    }

    private generateSortAndPaginationClause(context: QueryASTContext<Cypher.Node>): Cypher.With | undefined {
        const shouldGenerateSortWith = this.pagination || this.sortFields.length > 0;
        if (!shouldGenerateSortWith) {
            return undefined;
        }
        const paginationWith = new Cypher.With("*");
        this.addPaginationSubclauses(paginationWith);
        this.addSortSubclause(paginationWith, context);

        return paginationWith;
    }

    private addPaginationSubclauses(clause: Cypher.With): void {
        const paginationField = this.pagination && this.pagination.getPagination();
        if (paginationField?.limit) {
            clause.limit(paginationField.limit);
        }
        if (paginationField?.skip) {
            clause.skip(paginationField.skip);
        }
    }

    private addSortSubclause(clause: Cypher.With, context: QueryASTContext<Cypher.Node>): void {
        if (this.sortFields.length > 0) {
            const sortFields = this.getSortFields({
                context: context,
                nodeVar: context.target,
                edgeVar: context.relationship,
            });
            clause.orderBy(...sortFields);
        }
    }

    private addFiltersToClause(
        clause: Cypher.With | Cypher.Match | Cypher.Yield,
        context: QueryASTContext<Cypher.Node>
    ): void {
        const predicates = this.filters.map((f) => f.getPredicate(context));
        const authPredicate = this.getAuthFilterPredicate(context);
        const predicate = Cypher.and(...predicates, ...authPredicate);
        if (predicate) {
            clause.where(predicate);
        }
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

    /**
     *  This method resolves all the subqueries for each field and splits them into separate fields: `prePaginationSubqueries` and `postPaginationSubqueries`,
     *  in the `prePaginationSubqueries` are present all the subqueries required for the pagination purpose.
     **/
    private getPreAndPostPaginationSubqueries(context: QueryASTContext): {
        prePaginationSubqueries: Cypher.Clause[];
        postPaginationSubqueries: Cypher.Clause[];
    } {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const sortNodeFields = this.sortFields.flatMap((sf) => sf.node);
        const sortEdgeFields = this.sortFields.flatMap((sf) => sf.edge);

        const preAndPostFields = this.getPreAndPostFields(this.nodeFields);
        const preAndPostEdgeFields = this.getPreAndPostFields(this.edgeFields);

        const preNodeSubqueries = wrapSubqueriesInCypherCalls(context, preAndPostFields.Pre, [context.target]);
        const postNodeSubqueries = wrapSubqueriesInCypherCalls(context, preAndPostFields.Post, [context.target]);

        let preEdgeSubqueries: Cypher.Clause[] = [];
        let postEdgeSubqueries: Cypher.Clause[] = [];
        let sortEdgeSubqueries: Cypher.Clause[] = [];
        if (context.relationship) {
            preEdgeSubqueries = wrapSubqueriesInCypherCalls(context, preAndPostEdgeFields.Pre, [context.relationship]);
            postEdgeSubqueries = wrapSubqueriesInCypherCalls(context, preAndPostEdgeFields.Post, [
                context.relationship,
            ]);
            sortEdgeSubqueries = wrapSubqueriesInCypherCalls(context, sortEdgeFields, [context.relationship]);
        }
        const sortSubqueries = wrapSubqueriesInCypherCalls(context, sortNodeFields, [context.target]);

        return {
            prePaginationSubqueries: [
                ...sortSubqueries,
                ...sortEdgeSubqueries,
                ...preNodeSubqueries,
                ...preEdgeSubqueries,
            ],
            postPaginationSubqueries: [...postNodeSubqueries, ...postEdgeSubqueries],
        };
    }

    /** Given a set of fields and sortFields,  */
    private getPreAndPostFields(fields: Field[]): Record<"Pre" | "Post", Field[]> {
        return fields.reduce<Record<"Pre" | "Post", Field[]>>(
            (acc, nodeField) => {
                if (
                    nodeField instanceof OperationField &&
                    nodeField.isCypherField() &&
                    nodeField.operation instanceof CypherAttributeOperation
                ) {
                    acc.Pre.push(nodeField);
                    return acc;
                }

                acc.Post.push(nodeField);
                return acc;
            },
            { Pre: [], Post: [] }
        );
    }
}

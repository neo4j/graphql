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
import type { InterfaceEntityAdapter } from "../../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { filterTruthy } from "../../../../../utils/utils";
import { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import type { AggregationField } from "../../fields/aggregation-fields/AggregationField";
import type { Filter } from "../../filters/Filter";
import type { AuthorizationFilters } from "../../filters/authorization-filters/AuthorizationFilters";
import type { OperationTranspileResult } from "../operations";
import { Operation } from "../operations";
import type { CompositeAggregationPartial } from "./CompositeAggregationPartial";

export class CompositeAggregationOperation extends Operation {
    private children: CompositeAggregationPartial[];
    protected directed: boolean;
    public fields: AggregationField[] = [];
    public nodeFields: AggregationField[] = [];
    public edgeFields: AggregationField[] = [];

    private entity: InterfaceEntityAdapter | UnionEntityAdapter;

    protected authFilters: AuthorizationFilters[] = [];

    protected filters: Filter[] = [];
    private addWith: boolean = true;
    private aggregationProjectionMap: Cypher.Map = new Cypher.Map();
    private nodeMap = new Cypher.Map();
    private edgeMap = new Cypher.Map();

    constructor({
        compositeEntity,
        children,
        directed = true,
    }: {
        compositeEntity: InterfaceEntityAdapter | UnionEntityAdapter;
        children: CompositeAggregationPartial[];
        directed?: boolean;
    }) {
        super();
        this.entity = compositeEntity;
        this.children = children;
        this.directed = directed;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([
            ...this.fields,
            ...this.nodeFields,
            ...this.edgeFields,
            ...this.filters,
            ...this.authFilters,
            ...this.children,
        ]);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        const parentNode = context.target;

        if (parentNode) {
            return this.transpileAggregationOperation(context);
        } else {
            const newContext = new QueryASTContext({
                target: new Cypher.Node(),
                neo4jGraphQLContext: context.neo4jGraphQLContext,
            });
            const result = this.transpileAggregationOperation(newContext, false);

            const subqueriesAggr = result.clauses.map((clause) => {
                return new Cypher.Call(clause);
            });

            return {
                clauses: subqueriesAggr,
                projectionExpr: result.projectionExpr,
            };
        }
    }

    public setFields(fields: AggregationField[]) {
        this.fields = fields;
    }

    public addFilters(...filters: Filter[]) {
        this.filters.push(...filters);
    }
    public addAuthFilters(...filter: AuthorizationFilters[]) {
        this.authFilters.push(...filter);
    }

    public setNodeFields(fields: AggregationField[]) {
        this.nodeFields = fields;
    }

    public setEdgeFields(fields: AggregationField[]) {
        this.edgeFields = fields;
    }

    protected getPredicates(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const authPredicates = this.getAuthFilterPredicate(queryASTContext);
        return Cypher.and(...this.filters.map((f) => f.getPredicate(queryASTContext)), ...authPredicates);
    }

    protected getAuthFilterPredicate(context: QueryASTContext): Cypher.Predicate[] {
        return filterTruthy(this.authFilters.map((f) => f.getPredicate(context)));
    }

    protected getFieldProjectionClause(
        target: Cypher.Variable,
        returnVariable: Cypher.Variable,
        field: AggregationField
    ): Cypher.Clause {
        return field.getAggregationProjection(target, returnVariable);
    }

    private transpileAggregationOperation(context: QueryASTContext, addWith = true): OperationTranspileResult {
        this.addWith = addWith;

        const fieldSubqueries = this.createSubqueries(this.fields, context, this.aggregationProjectionMap);
        const nodeFieldSubqueries = this.createSubqueries(this.nodeFields, context, this.nodeMap);
        const edgeFieldSubqueries = this.createSubqueries(
            this.edgeFields,
            context,
            this.edgeMap,
            new Cypher.NamedNode("edge")
        );

        if (this.nodeMap.size > 0) {
            this.aggregationProjectionMap.set("node", this.nodeMap);
        }

        if (this.edgeMap.size > 0) {
            this.aggregationProjectionMap.set("edge", this.edgeMap);
        }

        return {
            clauses: [...fieldSubqueries, ...nodeFieldSubqueries, ...edgeFieldSubqueries],
            projectionExpr: this.aggregationProjectionMap,
        };
    }

    private createSubqueries(
        fields: AggregationField[],
        context: QueryASTContext,
        projectionMap: Cypher.Map,
        target: Cypher.NamedNode = new Cypher.NamedNode("node")
    ): Cypher.CompositeClause[] {
        return fields.map((field) => {
            const returnVariable = new Cypher.Node();
            const nestedContext = context.setReturn(returnVariable);
            const withClause: Cypher.With | undefined = this.createWithClause(context);

            const nestedSubquery = this.createNestedSubquery(nestedContext, target);

            projectionMap.set(field.getProjectionField(nestedContext.returnVariable));

            return Cypher.concat(
                nestedSubquery,
                withClause,
                field.getAggregationProjection(target, nestedContext.returnVariable)
            );
        });
    }

    private createWithClause(context: QueryASTContext): Cypher.With | undefined {
        const node = new Cypher.NamedNode("node");
        const filterContext = new QueryASTContext({
            neo4jGraphQLContext: context.neo4jGraphQLContext,
            target: node,
        });
        const filterPredicates = this.getPredicates(filterContext);

        let withClause: Cypher.With | undefined;
        if (filterPredicates) {
            withClause = new Cypher.With("*");
            withClause.where(filterPredicates);
        }
        return withClause;
    }

    private createNestedSubquery(context: QueryASTContext, target: Cypher.NamedNode): Cypher.Call {
        const parentNode = context.target;

        const nestedSubqueries = this.children.flatMap((c) => {
            if (target.name === "edge") {
                c.setAttachedTo("relationship");
            } else {
                c.setAttachedTo("node");
            }

            let clauses = c.getSubqueries(context);

            if (parentNode && this.addWith) {
                clauses = clauses.map((sq) => Cypher.concat(new Cypher.With(parentNode), sq));
            }
            return clauses;
        });

        return new Cypher.Call(new Cypher.Union(...nestedSubqueries));
    }
}

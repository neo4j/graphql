/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { InterfaceEntityAdapter } from "../../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import type { Pagination } from "../../pagination/Pagination";
import type { Sort, SortField } from "../../sort/Sort";
import type { OperationTranspileResult } from "../operations";
import { Operation } from "../operations";
import type { CompositeReadPartial } from "./CompositeReadPartial";

export class CompositeReadOperation extends Operation {
    private children: CompositeReadPartial[];
    private entity: InterfaceEntityAdapter | UnionEntityAdapter;
    private relationship: RelationshipAdapter | undefined;
    protected pagination: Pagination | undefined;
    protected sortFields: Sort[] = [];

    constructor({
        compositeEntity,
        children,
        relationship,
    }: {
        compositeEntity: InterfaceEntityAdapter | UnionEntityAdapter;
        children: CompositeReadPartial[];
        relationship: RelationshipAdapter | undefined;
    }) {
        super();
        this.entity = compositeEntity;
        this.children = children;
        this.relationship = relationship;
    }

    public getChildren(): QueryASTNode[] {
        return this.children;
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        const parentNode = context.target;
        const nestedSubqueries = this.children.flatMap((c) => {
            const result = c.transpile(context);

            let clauses = result.clauses;
            if (parentNode) {
                clauses = clauses.map((sq) => Cypher.utils.concat(new Cypher.With("*"), sq));
            }
            return clauses;
        });

        let aggrExpr: Cypher.Expr = Cypher.collect(context.returnVariable);
        if (!this.relationship) {
            aggrExpr = context.returnVariable;
        }
        if (this.relationship && !this.relationship.isList) {
            aggrExpr = Cypher.head(aggrExpr);
        }
        const nestedSubquery = new Cypher.Call(new Cypher.Union(...nestedSubqueries), "*").with(context.returnVariable);

        if (this.sortFields.length > 0) {
            nestedSubquery.orderBy(...this.getSortFields(context, context.returnVariable));
        }
        if (this.pagination) {
            const paginationField = this.pagination.getPagination();
            if (paginationField) {
                if (paginationField.skip) {
                    nestedSubquery.skip(paginationField.skip);
                }
                if (paginationField.limit) {
                    nestedSubquery.limit(paginationField.limit);
                }
            }
        }

        nestedSubquery.return([aggrExpr, context.returnVariable]);

        return {
            clauses: [nestedSubquery],
            projectionExpr: context.returnVariable,
        };
    }

    public addPagination(pagination: Pagination): void {
        this.pagination = pagination;
    }

    public addSort(...sortElement: Sort[]): void {
        this.sortFields.push(...sortElement);
    }

    protected getSortFields(context: QueryASTContext, target: Cypher.Variable): SortField[] {
        return this.sortFields.flatMap((sf) => sf.getSortFields(context, target, false));
    }
}

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Clause } from "@neo4j/cypher-builder";
import type { InterfaceEntityAdapter } from "../../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { filterTruthy } from "../../../../../utils/utils";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import type { OperationTranspileResult } from "../operations";
import { MutationOperation } from "../operations";
import type { CompositeConnectPartial } from "./CompositeConnectPartial";

export class CompositeConnectOperation extends MutationOperation {
    private partials: CompositeConnectPartial[] = [];
    private target: InterfaceEntityAdapter | UnionEntityAdapter;

    constructor({
        partials,
        target,
    }: {
        partials: CompositeConnectPartial[];
        target: InterfaceEntityAdapter | UnionEntityAdapter;
    }) {
        super();
        this.partials = partials;
        this.target = target;
    }

    public print(): string {
        return `${super.print()} <${this.target.name}>`;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([...this.partials]);
    }

    transpile(context: QueryASTContext): OperationTranspileResult {
        const clauses = this.partials.flatMap((partial) => {
            return partial.transpile(context).clauses;
        });
        return {
            projectionExpr: context.returnVariable,
            clauses,
        };
    }

    getAuthorizationSubqueries(context: QueryASTContext): Clause[] {
        return this.partials.flatMap((partial) => {
            return partial.getAuthorizationSubqueries(context);
        });
    }
}

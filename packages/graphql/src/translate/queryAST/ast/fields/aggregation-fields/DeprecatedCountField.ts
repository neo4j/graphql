/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { Entity } from "../../../../../schema-model/entity/Entity";
import type { QueryASTNode } from "../../QueryASTNode";
import { AggregationField } from "./AggregationField";

export class DeprecatedCountField extends AggregationField {
    private entity: Entity;

    constructor({ alias, entity }: { alias: string; entity: Entity }) {
        super(alias);
        this.entity = entity;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public getProjectionField(variable: Cypher.Variable): Record<string, Cypher.Expr> {
        return { [this.alias]: variable };
    }

    public getAggregationExpr(variable: Cypher.Variable): Cypher.Expr {
        return Cypher.count(variable);
    }

    public getAggregationProjection(target: Cypher.Variable, returnVar: Cypher.Variable): Cypher.Clause {
        return new Cypher.Return([this.getAggregationExpr(target), returnVar]);
    }
}

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { Entity } from "../../../../../schema-model/entity/Entity";
import type { QueryASTNode } from "../../QueryASTNode";
import { AggregationField } from "./AggregationField";

export class CountField extends AggregationField {
    private entity: Entity;
    public edgeVar: Cypher.Variable | undefined;

    private countFields: { nodes: boolean; edges: boolean };
    private groupByMode: boolean;

    constructor({
        alias,
        entity,
        fields,
        groupByMode = false,
    }: {
        alias: string;
        entity: Entity;
        fields: { nodes: boolean; edges: boolean };
        groupByMode?: boolean;
    }) {
        super(alias);
        this.entity = entity;
        this.countFields = fields;
        this.groupByMode = groupByMode;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public getProjectionField(variable: Cypher.Variable): Record<string, Cypher.Expr> {
        return { [this.alias]: variable };
    }

    public getAggregationExpr(variable: Cypher.Variable): Cypher.Expr {
        // context.varTarget.property("edges");
        return this.groupByMode ? Cypher.size(variable.property("aggregate")) : Cypher.count(variable).distinct();
    }

    public getAggregationProjection(target: Cypher.Variable, returnVar: Cypher.Variable): Cypher.Clause {
        const resultMap = new Cypher.Map();

        if (this.countFields.nodes) {
            resultMap.set("nodes", this.getAggregationExpr(target));
        }
        if (this.countFields.edges) {
            if (!this.edgeVar) {
                throw new Error(
                    "Edge variable not defined in Count field. This is likely a bug with the GraphQL library."
                );
            }
            resultMap.set("edges", this.getAggregationExpr(this.edgeVar));
        }

        return new Cypher.Return([resultMap, returnVar]);
    }
}

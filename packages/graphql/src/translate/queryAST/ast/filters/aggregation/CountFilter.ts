/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { AggregationLogicalOperator } from "../../../factory/parsers/parse-where-field";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import { AggregationFilter } from "./AggregationFilter";

export class CountFilter extends AggregationFilter {
    protected comparisonValue: unknown;
    protected operator: AggregationLogicalOperator;

    constructor({
        operator,
        comparisonValue,
        attachedTo = "node",
        relationship,
        isDeprecated,
    }: {
        operator: AggregationLogicalOperator;
        comparisonValue: unknown;
        attachedTo?: "node" | "relationship";
        relationship: RelationshipAdapter;
        isDeprecated?: boolean;
    }) {
        super(relationship, isDeprecated, attachedTo);
        this.comparisonValue = comparisonValue;
        this.operator = operator;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public print(): string {
        return `${super.print()} <${this.operator}>`;
    }

    public getSubqueryReturnVariable(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        if (!queryASTContext.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const target = this.getTarget(queryASTContext);

        return this.createBaseOperation({
            operator: this.operator,
            expr: Cypher.count(target),
            param: new Cypher.Param(this.comparisonValue),
        });
    }

    protected getTarget(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.Node | Cypher.Relationship {
        const target = this.attachedTo === "node" ? queryASTContext.target : queryASTContext.relationship;
        if (!target) {
            throw new Error("No target found");
        }
        return target;
    }
}

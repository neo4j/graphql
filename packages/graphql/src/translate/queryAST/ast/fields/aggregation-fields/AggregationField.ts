/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import { Field } from "../Field";

export abstract class AggregationField extends Field {
    public abstract getProjectionField(_variable: Cypher.Variable): Record<string, Cypher.Expr>;

    public abstract getAggregationExpr(variable: Cypher.Variable | Cypher.Property): Cypher.Expr;
    public abstract getAggregationProjection(target: Cypher.Variable, returnVar: Cypher.Variable): Cypher.Clause;
}

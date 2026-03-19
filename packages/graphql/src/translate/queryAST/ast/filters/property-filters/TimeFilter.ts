/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { createTimeOperation } from "../utils/create-time-operation";
import { PropertyFilter } from "./PropertyFilter";

export class TimeFilter extends PropertyFilter {
    protected getOperation(prop: Cypher.Property): Cypher.ComparisonOp {
        return createTimeOperation({
            operator: this.operator || "EQ",
            property: prop,
            param: new Cypher.Param(this.comparisonValue),
            attribute: this.attribute,
        });
    }
}

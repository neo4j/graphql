/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { coalesceValueIfNeeded } from "../utils/coalesce-if-needed";
import { createDurationOperation } from "../utils/create-duration-operation";
import { PropertyFilter } from "./PropertyFilter";

export class DurationFilter extends PropertyFilter {
    protected getOperation(prop: Cypher.Expr): Cypher.ComparisonOp {
        const coalesceProperty = coalesceValueIfNeeded(this.attribute, prop);

        return createDurationOperation({
            operator: this.operator,
            property: coalesceProperty,
            param: new Cypher.Param(this.comparisonValue),
        });
    }
}

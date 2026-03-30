/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { integer } from "neo4j-driver";
import { isIntegerable } from "../../../schema/resolvers/field/numerical";

export function sridToCrs(srid: unknown): string {
    if (!isIntegerable(srid)) {
        return "";
    }

    const integerSrid = integer.toNumber(srid);

    switch (integerSrid) {
        case 4326:
            return "wgs-84";
        case 4979:
            return "wgs-84-3d";
        case 7203:
            return "cartesian";
        case 9157:
            return "cartesian-3d";
        default:
            return "";
    }
}

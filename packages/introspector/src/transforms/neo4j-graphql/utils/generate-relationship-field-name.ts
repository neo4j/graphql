/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import camelcase from "camelcase";
import pluralize from "pluralize";
import type { Direction } from "../types";

export default function inferRelationshipFieldName(
    relType: string,
    fromType: string,
    toType: string,
    direction: Direction
): string {
    const sanitizedRelType = relType.replaceAll(/[\s/()\\`]/g, "");
    if (direction === "OUT") {
        return camelcase(sanitizedRelType + pluralize(toType));
    }
    return camelcase(pluralize(fromType) + sanitizedRelType);
}

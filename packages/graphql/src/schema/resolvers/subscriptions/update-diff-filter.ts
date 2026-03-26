/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { SubscriptionsEvent } from "../../../types";
import { haveSameLength } from "../../../utils/utils";
import { compareProperties } from "./utils/compare-properties";

export function updateDiffFilter(event: SubscriptionsEvent): boolean {
    if (event.event !== "update") {
        return true;
    }
    if (!haveSameLength(event.properties.old, event.properties.new)) {
        return true;
    }
    const haveSameProperties = compareProperties(event.properties.old, event.properties.new);
    if (!haveSameProperties) {
        return true;
    }

    return false;
}

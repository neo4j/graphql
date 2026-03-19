/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { SubscriptionsEvent } from "../../../../types";
import type { RecordType, RelationshipType } from "../types";
import { filterByProperties } from "./filters/filter-by-properties";

export function subscriptionWhere({
    where,
    event,
    entityAdapter,
}: {
    where: Record<string, RecordType | RelationshipType> | undefined;
    event: SubscriptionsEvent;
    entityAdapter: ConcreteEntityAdapter;
}): boolean {
    if (!where) {
        return true;
    }

    if (event.event === "create") {
        return filterByProperties({
            attributes: entityAdapter.attributes,
            whereProperties: where,
            receivedProperties: event.properties.new,
        });
    }

    if (event.event === "update" || event.event === "delete") {
        return filterByProperties({
            attributes: entityAdapter.attributes,
            whereProperties: where,
            receivedProperties: event.properties.old,
        });
    }

    return false;
}

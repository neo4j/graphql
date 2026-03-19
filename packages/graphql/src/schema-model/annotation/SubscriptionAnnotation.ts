/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { SubscriptionEvent } from "../../graphql/directives/subscription";
import type { Annotation } from "./Annotation";

export class SubscriptionAnnotation implements Annotation {
    readonly name = "subscription";
    public readonly events: Set<SubscriptionEvent>;

    constructor({ events }: { events: Set<SubscriptionEvent> }) {
        this.events = events;
    }
}

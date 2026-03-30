/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { DateTime } from "neo4j-driver";

export type CDCNodeEvent = {
    elementId: string;
    eventType: "n";
    state: {
        before?: CDCEventState;
        after?: CDCEventState;
    };
    operation: CDCOperation;
    labels: string[];
};
export type CDCQueryResponse = {
    id: string;
    event: CDCEvent;
    metadata: CDCMetadata;
};

type CDCEventState = {
    properties: Record<string, unknown>;
    labels: string[];
};
type CDCEventRelationshipState = {
    properties: Record<string, unknown>;
};

type CDCRelationshipNode = {
    elementId: string;
    labels: string[];
};

type CDCOperation = "c" | "d" | "u";

type CDCRelationshipEvent = {
    elementId: string;
    eventType: "r";
    start: CDCRelationshipNode;
    end: CDCRelationshipNode;
    state: {
        before?: CDCEventRelationshipState;
        after?: CDCEventRelationshipState;
    };
    operation: CDCOperation;
    type: string;
};

type CDCMetadata = {
    txStartTime: DateTime;
    // Other metadata is ignored here
};

type CDCEvent = CDCNodeEvent | CDCRelationshipEvent;

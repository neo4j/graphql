/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { DateTime, Integer } from "neo4j-driver";

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

export type CDCRelationshipEvent = {
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

export type CDCMetadata = {
    txStartTime: DateTime;
    // Other metadata is ignored here
};

export type CDCEvent = CDCNodeEvent | CDCRelationshipEvent;

export type CDCQueryResponse = {
    id: string;
    event: CDCEvent;
    metadata: CDCMetadata;
    txId: Integer;
    seq: Integer;
};

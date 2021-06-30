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

import { cursorToOffset, getOffsetWithDefault, offsetToCursor } from "graphql-relay/connection/arrayConnection";
import { Integer, isInt } from "neo4j-driver";

/**
 * Adapted from graphql-relay-js ConnectionFromArraySlice
 */
export function createConnectionWithEdgeProperties(
    arraySlice: { node: Record<string, any>; [key: string]: any }[],
    args: { after?: string; first?: number } = {},
    totalCount: number
) {
    const { after, first } = args;
    const sliceStart = (typeof after === "string" ? cursorToOffset(after) : 0) + 1;
    const sliceEnd = sliceStart + arraySlice.length;

    let startOffset = Math.max(sliceStart, 0);

    const afterOffset = getOffsetWithDefault(after, -1);

    if (afterOffset >= 0 && afterOffset < totalCount) {
        startOffset = Math.max(startOffset, afterOffset + 1);
    }

    const edges = arraySlice.map((value, index) => ({
        ...value,
        cursor: offsetToCursor(startOffset + index),
    }));

    const firstEdge = edges[0];
    const lastEdge = edges[edges.length - 1];
    return {
        edges,
        pageInfo: {
            startCursor: firstEdge.cursor,
            endCursor: lastEdge.cursor,
            hasPreviousPage: afterOffset > 0,
            hasNextPage: typeof first === "number" ? sliceEnd < totalCount : false,
        },
    };
}

export function createSkipLimitStr({ skip, limit }: { skip?: number | Integer; limit?: number | Integer }): string {
    const hasSkip = typeof skip !== "undefined";
    const hasLimit = typeof limit !== "undefined";
    let skipLimitStr = "";

    if (hasSkip && !hasLimit) {
        skipLimitStr = `[${skip}..]`;
    }

    if (hasLimit && !hasSkip) {
        skipLimitStr = `[..${limit}]`;
    }

    if (hasLimit && hasSkip) {
        const sliceStart = isInt(skip as Integer) ? (skip as Integer).toNumber() : skip;
        const itemsToGrab = isInt(limit as Integer) ? (limit as Integer).toNumber() : limit;
        const sliceEnd = (sliceStart as number) + (itemsToGrab as number);
        skipLimitStr = `[${skip}..${sliceEnd}]`;
    }

    return skipLimitStr;
}

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

import { getOffsetWithDefault, offsetToCursor } from "graphql-relay/connection/arrayConnection";
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

    if ((first as number) < 0) {
        throw new Error('Argument "first" must be a non-negative integer');
    }

    // after returns the last cursor in the previous set or -1 if invalid
    const lastEdgeCursor = getOffsetWithDefault(after, -1);

    // increment the last cursor position by one for the sliceStart
    const sliceStart = lastEdgeCursor + 1;

    const sliceEnd = sliceStart + ((first as number) || arraySlice.length);

    const edges = arraySlice.map((value, index) => {
        return {
            ...value,
            cursor: offsetToCursor(sliceStart + index),
        };
    });

    const firstEdge = edges[0];
    const lastEdge = edges[edges.length - 1];
    return {
        edges,
        pageInfo: {
            startCursor: firstEdge ? firstEdge.cursor : null,
            endCursor: lastEdge ? lastEdge.cursor : null,
            hasPreviousPage: lastEdgeCursor > 0,
            hasNextPage: typeof first === "number" ? sliceEnd < totalCount : false,
        },
    };
}

export function createOffsetLimitStr({
    offset,
    limit,
}: {
    offset?: number | Integer;
    limit?: number | Integer;
}): string {
    const hasOffset = typeof offset !== "undefined" && offset !== 0;
    const hasLimit = typeof limit !== "undefined" && limit !== 0;
    let offsetLimitStr = "";

    if (hasOffset && !hasLimit) {
        offsetLimitStr = `[${offset}..]`;
    }

    if (hasLimit && !hasOffset) {
        offsetLimitStr = `[..${limit}]`;
    }

    if (hasLimit && hasOffset) {
        const sliceStart = isInt(offset as Integer) ? (offset as Integer).toNumber() : offset;
        const itemsToGrab = isInt(limit as Integer) ? (limit as Integer).toNumber() : limit;
        const sliceEnd = (sliceStart as number) + (itemsToGrab as number);
        offsetLimitStr = `[${offset}..${sliceEnd}]`;
    }

    return offsetLimitStr;
}

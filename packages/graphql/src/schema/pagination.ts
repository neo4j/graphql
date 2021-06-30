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

/**
 * Adapted from graphql-relay-js ConnectionFromArraySlice
 */
export function createConnectionWithEdgeProperties(
    arraySlice: { node: Record<string, any>; [key: string]: any }[],
    args: { after?: string; first?: number } = {},
    totalCount: number
) {
    const { after, first } = args;
    const offset = getOffsetWithDefault(after, 0);
    const limit = first ?? arraySlice.length;
    const sliceEnd = offset + limit;

    const edges = arraySlice.map((value, index) => ({
        ...value,
        cursor: offsetToCursor(offset + index),
    }));

    const firstEdge = edges[0];
    const lastEdge = edges[edges.length - 1];
    const lowerBound = after != null ? offset : 0;
    return {
        edges,
        pageInfo: {
            startCursor: firstEdge ? firstEdge.cursor : null,
            endCursor: lastEdge ? lastEdge.cursor : null,
            hasPreviousPage: offset > lowerBound,
            hasNextPage: typeof first === "number" ? sliceEnd < totalCount : false,
        },
    };
}

export function createSkipLimitStr({ skip, limit }: { skip?: number; limit?: number }): string {
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
        skipLimitStr = `[${skip}..${limit}]`;
    }

    return skipLimitStr;
}

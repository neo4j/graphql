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

import { ConnectionArguments } from "graphql-relay";
import { ArraySliceMetaInfo, getOffsetWithDefault, offsetToCursor } from "graphql-relay/connection/arrayConnection";

/**
 * Adapted from graphql-relay-js ConnectionFromArraySlice
 */
const createConnectionWithEdgeProperties = (
    arraySlice: { node: Record<string, any>; [key: string]: any }[],
    args: ConnectionArguments,
    meta: ArraySliceMetaInfo
) => {
    const { after, before, first, last } = args;
    const { sliceStart, arrayLength } = meta;
    const sliceEnd = sliceStart + arraySlice.length;
    const beforeOffset = getOffsetWithDefault(before, arrayLength);
    const afterOffset = getOffsetWithDefault(after, -1);

    let startOffset = Math.max(sliceStart - 1, afterOffset, -1) + 1;
    let endOffset = Math.min(sliceEnd, beforeOffset, arrayLength);
    if (typeof first === "number") {
        if (first < 0) {
            throw new Error('Argument "first" must be a non-negative integer');
        }

        endOffset = Math.min(endOffset, startOffset + first);
    }
    if (typeof last === "number") {
        if (last < 0) {
            throw new Error('Argument "last" must be a non-negative integer');
        }

        startOffset = Math.max(startOffset, endOffset - last);
    }

    // If supplied slice is too large, trim it down before mapping over it.
    const slice = arraySlice.slice(Math.max(startOffset - sliceStart, 0), arraySlice.length - (sliceEnd - endOffset));

    const edges = slice.map((value, index) => {
        return {
            ...value,
            cursor: offsetToCursor(startOffset + index),
        };
    });

    const firstEdge = edges[0];
    const lastEdge = edges[edges.length - 1];
    const lowerBound = after != null ? afterOffset + 1 : 0;
    const upperBound = before != null ? beforeOffset : arrayLength;
    return {
        edges,
        pageInfo: {
            startCursor: firstEdge ? firstEdge.cursor : null,
            endCursor: lastEdge ? lastEdge.cursor : null,
            hasPreviousPage: typeof last === "number" ? startOffset > lowerBound : false,
            hasNextPage: typeof first === "number" ? endOffset < upperBound : false,
        },
    };
};

export default createConnectionWithEdgeProperties;

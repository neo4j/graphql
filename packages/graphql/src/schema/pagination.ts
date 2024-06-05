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

import { Kind, type FieldNode, type GraphQLResolveInfo, type SelectionSetNode } from "graphql";
import { getOffsetWithDefault, offsetToCursor } from "graphql-relay/connection/arrayConnection";
import type { ConnectionQueryArgs } from "../types";
import { isNeoInt } from "../utils/utils";

function getAliasKey({ selectionSet, key }: { selectionSet: SelectionSetNode | undefined; key: string }): string {
    for (const field of selectionSet?.selections || []) {
        if (field.kind === Kind.FIELD && field.name.value === key && field.alias) {
            return field.alias.value;
        }
    }

    return key;
}

export function connectionFieldResolver({
    connectionFieldName,
    source,
    args,
    info,
}: {
    connectionFieldName: string;
    source: any;
    args: ConnectionQueryArgs;
    info: GraphQLResolveInfo;
}) {
    const firstField = info.fieldNodes[0];

    if (!firstField) {
        throw new Error("Field not found");
    }

    const { selectionSet } = firstField;

    let value = source[connectionFieldName];
    if (firstField.alias) {
        value = source[firstField.alias.value];
    }

    const totalCountKey = getAliasKey({ selectionSet, key: "totalCount" });
    const { totalCount } = value;

    return {
        [totalCountKey]: isNeoInt(totalCount) ? totalCount.toNumber() : totalCount,
        ...createConnectionWithEdgeProperties({ source: value, selectionSet, args, totalCount }),
    };
}

/**
 * Adapted from graphql-relay-js ConnectionFromArraySlice
 */
export function createConnectionWithEdgeProperties({
    selectionSet,
    source,
    args = {},
    totalCount,
}: {
    selectionSet: SelectionSetNode | undefined;
    source: any;
    args: { after?: string; first?: number };
    totalCount: number;
}) {
    const { after, first } = args;

    if ((first as number) < 0) {
        throw new Error('Argument "first" must be a non-negative integer');
    }

    // after returns the last cursor in the previous set or -1 if invalid
    const lastEdgeCursor = getOffsetWithDefault(after, -1);

    // increment the last cursor position by one for the sliceStart
    const sliceStart = lastEdgeCursor + 1;

    const edges: any[] = source?.edges || [];

    const selections = selectionSet?.selections || [];

    const edgesField = selections.find((x): x is FieldNode => x.kind === Kind.FIELD && x.name.value === "edges");
    const cursorKey = getAliasKey({ selectionSet: edgesField?.selectionSet, key: "cursor" });
    const nodeKey = getAliasKey({ selectionSet: edgesField?.selectionSet, key: "node" });

    const sliceEnd = sliceStart + (first || edges.length);

    const mappedEdges = edges.map((value, index) => {
        return {
            ...value,
            ...(value.node ? { [nodeKey]: value.node } : {}),
            [cursorKey]: offsetToCursor(sliceStart + index),
        };
    });

    const startCursor = mappedEdges[0]?.cursor;
    const endCursor = mappedEdges[mappedEdges.length - 1]?.cursor;

    const pageInfoKey = getAliasKey({ selectionSet, key: "pageInfo" });
    const edgesKey = getAliasKey({ selectionSet, key: "edges" });
    const pageInfoField = selections.find((x): x is FieldNode => x.kind === Kind.FIELD && x.name.value === "pageInfo");
    const pageInfoSelectionSet = pageInfoField?.selectionSet;
    const startCursorKey = getAliasKey({ selectionSet: pageInfoSelectionSet, key: "startCursor" });
    const endCursorKey = getAliasKey({ selectionSet: pageInfoSelectionSet, key: "endCursor" });
    const hasPreviousPageKey = getAliasKey({ selectionSet: pageInfoSelectionSet, key: "hasPreviousPage" });
    const hasNextPageKey = getAliasKey({ selectionSet: pageInfoSelectionSet, key: "hasNextPage" });

    return {
        [edgesKey]: mappedEdges,
        [pageInfoKey]: {
            [startCursorKey]: startCursor,
            [endCursorKey]: endCursor,
            [hasPreviousPageKey]: sliceStart > 0,
            [hasNextPageKey]: typeof first === "number" ? sliceEnd < totalCount : false,
        },
    };
}

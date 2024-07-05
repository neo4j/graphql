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

import type { GraphQLResolveInfo } from "graphql";
import type { PageInfo } from "graphql-relay";
import { createConnectionWithEdgeProperties } from "../../schema/pagination";
import type { ConnectionQueryArgs } from "../../types";
import { isNeoInt } from "../../utils/utils";

/** Maps the connection results adding pageInfo and cursors */
export function connectionOperationResolver(source, args: ConnectionQueryArgs, _ctx, _info: GraphQLResolveInfo) {
    const totalCount = isNeoInt(source.connection.totalCount)
        ? source.connection.totalCount.toNumber()
        : source.connection.totalCount;

    const connection = createConnectionWithEdgeProperties({
        selectionSet: undefined,
        source: source.connection,
        args: { first: args.first, after: args.after },
        totalCount,
    });
    const edges = connection.edges as any[];
    const pageInfo = connection.pageInfo as PageInfo;

    return {
        edges,
        pageInfo,
    };
}

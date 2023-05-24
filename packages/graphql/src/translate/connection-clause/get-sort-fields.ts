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

import type { ResolveTree } from "graphql-parse-resolve-info";
import type { GraphQLSortArg } from "../../types";

export type SortFields = { edge: GraphQLSortArg } | { node: GraphQLSortArg };

export function getSortFields(resolveTree: ResolveTree): SortFields[] {
    return (resolveTree.args.sort ?? []) as SortFields[];
}
/** Returns keys of sort fields on edges for connections */
export function getEdgeSortFieldKeys(resolveTree: ResolveTree): string[] {
    return getSortFields(resolveTree).reduce((acc: string[], x: SortFields) => {
        if ("edge" in x) {
            acc.push(...Object.keys(x.edge));
        }
        return acc;
    }, []);
}

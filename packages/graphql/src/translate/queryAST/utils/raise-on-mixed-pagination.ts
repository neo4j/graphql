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

export function raiseOnMixedPagination({
    optionsArg,
    sort,
    limit,
    offset,
}: {
    optionsArg: Record<string, any>;
    sort: any;
    limit: any;
    offset: any;
}) {
    if (Object.keys(optionsArg).length > 0 && (sort !== undefined || limit !== undefined || offset !== undefined)) {
        throw new Error(
            `Ambiguous pagination found. The options argument is deprecated. Please use the sort, limit, and offset arguments directly on the field.`
        );
    }
}

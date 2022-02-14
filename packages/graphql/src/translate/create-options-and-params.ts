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

import { GraphQLOptionsArg } from "../types";

export default function createOptionsAndParams({
    optionsInput,
    varName,
}: {
    optionsInput: GraphQLOptionsArg;
    varName: string;
}): [string, Record<string, unknown>] {
    const hasOffset = Boolean(optionsInput.offset) || optionsInput.offset === 0;
    return [
        [
            optionsInput.sort
                ? `ORDER BY ${optionsInput.sort
                      .reduce(
                          (res, sort) => [
                              ...res,
                              ...Object.entries(sort).map(([field, direction]) => `${varName}.${field} ${direction}`),
                          ],
                          [] as string[]
                      )
                      .join(", ")}`
                : "",
            hasOffset ? `SKIP $${varName}_offset` : "",
            optionsInput.limit ? `LIMIT $${varName}_limit` : "",
        ]
            .filter(Boolean)
            .join("\n"),
        {
            ...(optionsInput.offset && { [`${varName}_offset`]: optionsInput.offset }),
            ...(optionsInput.limit && { [`${varName}_limit`]: optionsInput.limit }),
        },
    ];
}

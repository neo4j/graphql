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

import type { Debugger } from "debug";
import { print, type GraphQLResolveInfo } from "graphql";

/**
 * Logs the GraphQL query and variable values from a GraphQLResolveInfo instance.
 *
 * @param debug A Debugger instance.
 * @param info The GraphQLResolveInfo instance to be logged.
 */
export function debugGraphQLResolveInfo(debug: Debugger, info: GraphQLResolveInfo) {
    if (debug.enabled) {
        const query = print(info.operation);
        debug("received graphql query");
        debug(query);
        debug("variable values: %O", "variable values:", info.variableValues);
    }
}

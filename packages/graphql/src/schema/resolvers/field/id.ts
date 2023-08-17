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
import { defaultFieldResolver } from "./defaultField";
import { isNeoInt } from "../../../utils/utils";
import type { Neo4jGraphQLContext } from "../../../types/neo4j-graphql-context";

function serializeValue(value) {
    if (isNeoInt(value)) {
        return value.toNumber();
    }

    if (typeof value === "number") {
        return value.toString(10);
    }

    return value;
}

export function idResolver(source, args, context: Neo4jGraphQLContext, info: GraphQLResolveInfo) {
    const value = defaultFieldResolver(source, args, context, info);

    if (Array.isArray(value)) {
        return value.map((v) => {
            return serializeValue(v);
        });
    }

    return serializeValue(value);
}

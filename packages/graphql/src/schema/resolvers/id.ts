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

import { isInt } from "neo4j-driver";
import { GraphQLResolveInfo } from "graphql";
import defaultFieldResolver from "./defaultField";
import { Context } from "../../types";

function id(source, args, context: Context, info: GraphQLResolveInfo) {
    const value = defaultFieldResolver(source, args, context, info);

    if (isInt(value)) {
        return value.toNumber();
    }

    if (typeof value === "number") {
        return value.toString(10);
    }

    return value;
}

export default id;

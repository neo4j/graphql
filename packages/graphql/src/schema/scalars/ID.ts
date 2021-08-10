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

import { GraphQLScalarType } from "graphql";
import { Integer } from "neo4j-driver";

/*
    https://spec.graphql.org/June2018/#sec-ID
    The ID type is serialized in the same way as a String
*/
export default new GraphQLScalarType({
    name: "ID",
    parseValue(value: string | number) {
        if (typeof value === "string") {
            return value;
        }

        return value.toString(10);
    },
    serialize(value: Integer | string | number) {
        if (typeof value === "string") {
            return value;
        }

        return value.toString(10);
    },
});

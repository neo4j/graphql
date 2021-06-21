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
import neo4j from "neo4j-driver";

export default new GraphQLScalarType({
    name: "Date",
    description: "A date, represented as a 'yyyy-mm-dd' string",
    serialize: (value: typeof neo4j.types.Date) => {
        return new Date(value.toString()).toISOString().split("T")[0];
    },
    parseValue: (value: string) => {
        return neo4j.types.Date.fromStandardDate(new Date(value));
    },
});

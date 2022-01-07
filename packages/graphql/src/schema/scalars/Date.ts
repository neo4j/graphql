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

import { GraphQLError, GraphQLScalarType } from "graphql";
import neo4j, { Date as Neo4jDate, isDate } from "neo4j-driver";

export default new GraphQLScalarType<Neo4jDate<number>, string>({
    name: "Date",
    description: "A date, represented as a 'yyyy-mm-dd' string",
    serialize: (outputValue) => {
        if (typeof outputValue === "string") {
            return new Date(outputValue).toISOString();
        }

        if (isDate(outputValue as any)) {
            return new Date((outputValue as typeof Neo4jDate).toString()).toISOString().split("T")[0];
        }

        throw new GraphQLError(`Date cannot represent value: ${outputValue}`);
    },
    parseValue: (inputValue) => {
        if (typeof inputValue !== "string") {
            throw new GraphQLError(`Date cannot represent non string value: ${inputValue}`);
        }

        return neo4j.types.Date.fromStandardDate(new Date(inputValue));
    },
});

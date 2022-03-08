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

import { GraphQLError, GraphQLScalarType, Kind, ValueNode } from "graphql";
import neo4j, { isDate, Date as Neo4jDate } from "neo4j-driver";

export const GraphQLDate = new GraphQLScalarType<Neo4jDate<number>, string>({
    name: "Date",
    description: "A date, represented as a 'yyyy-mm-dd' string",
    serialize: (outputValue: unknown) => {
        if (typeof outputValue === "string") {
            return new Date(outputValue).toISOString();
        }

        if (isDate(outputValue as object)) {
            return new Date((outputValue as typeof neo4j.types.Date).toString()).toISOString().split("T")[0];
        }

        throw new GraphQLError(`Date cannot represent value: ${outputValue}`);
    },
    parseValue: (inputValue: unknown) => {
        if (typeof inputValue === "string") {
            return neo4j.types.Date.fromStandardDate(new Date(inputValue));
        }

        if (isDate(inputValue as object)) {
            return inputValue as Neo4jDate<number>;
        }

        throw new GraphQLError(`Date cannot represent non string value: ${inputValue}`);
    },
    parseLiteral(ast: ValueNode) {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError("Date cannot represent non string value.");
        }

        return neo4j.types.Date.fromStandardDate(new Date(ast.value));
    },
});

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

/* eslint-disable import/prefer-default-export */

import { GraphQLScalarType, Kind } from "graphql";

export const ScalarType = new GraphQLScalarType({
    name: "Scalar",
    description: "Int | Float | String | Boolean | ID | DateTime",
    serialize(value) {
        if (!["string", "number", "boolean"].includes(typeof value)) {
            throw new Error("Value must be one of types: Int | Float | String | Boolean | ID | DateTime");
        }

        return value;
    },
    parseValue(value) {
        if (!["string", "number", "boolean"].includes(typeof value)) {
            throw new Error("Value must be one of types: Int | Float | String | Boolean | ID | DateTime");
        }

        return value;
    },
    parseLiteral(ast) {
        switch (ast.kind) {
            case Kind.INT:
                return parseInt(ast.value, 10);
            case Kind.FLOAT:
                return parseFloat(ast.value);
            case Kind.STRING:
                return ast.value;
            case Kind.BOOLEAN:
                return ast.value;
            default:
                throw new Error("Value must be one of types: Int | Float | String | Boolean | ID | DateTime");
        }
    },
});

/* eslint-enable import/prefer-default-export */

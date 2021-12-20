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

import { GraphQLError, GraphQLScalarType, Kind } from "graphql";

export const ScalarType = new GraphQLScalarType({
    name: "Scalar",
    description: "Int | Float | String | Boolean | ID | DateTime | Date",
    serialize(value) {
        if (!["string", "number", "boolean"].includes(typeof value)) {
            throw new Error("Value must be one of types: Int | Float | String | Boolean | ID | DateTime | Date");
        }

        return value;
    },
    parseValue(value) {
        if (!["string", "number", "boolean"].includes(typeof value)) {
            throw new Error("Value must be one of types: Int | Float | String | Boolean | ID | DateTime | Date");
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
                throw new Error("Value must be one of types: Int | Float | String | Boolean | ID | DateTime | Date");
        }
    },
});

/**
 * Allows multiple relationship types
 * @example
 * DIRECTED
 * DIRECTED|ACTED_IN
 * DIRECTED|ACTED_IN|PRODUCED
 */
const RELATIONSHIP_TYPE_REGEX = /^[A-Za-z]\w*(?:\|[A-Za-z]\w*)*$/;

export const RelationshipType = new GraphQLScalarType({
    name: "RelationshipType",
    description:
        'A string value representing how the field relates to the parent. Can be multiple types as in "DIRECTED|ACTED_IN"',
    serialize(value) {
        if (typeof value !== "string") {
            throw new TypeError(`Value is not string: ${value}`);
        }
        if (!RELATIONSHIP_TYPE_REGEX.test(value)) {
            throw new TypeError(`Value is not a valid relationship type: ${value}`);
        }
        return value;
    },
    parseValue(value) {
        if (typeof value !== "string") {
            throw new TypeError(`Value is not string: ${value}`);
        }
        if (!RELATIONSHIP_TYPE_REGEX.test(value)) {
            throw new TypeError(`Value is not a valid relationship type: ${value}`);
        }
        return value;
    },
    parseLiteral(ast) {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError(`Can only validate strings as relationship types but got a: ${ast.kind}`);
        }
        if (!RELATIONSHIP_TYPE_REGEX.test(ast.value)) {
            throw new TypeError(`Value is not a valid relationship type: ${ast.value}`);
        }
        return ast.value;
    },
});

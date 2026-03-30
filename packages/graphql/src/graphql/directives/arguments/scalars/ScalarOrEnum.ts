/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLScalarType, Kind } from "graphql";

export const ScalarOrEnumType = new GraphQLScalarType({
    name: "ScalarOrEnum",
    description: "Int | Float | String | Boolean | ID | DateTime | Date | Enum",
    serialize(value) {
        if (!["string", "number", "boolean"].includes(typeof value)) {
            throw new Error("Value must be one of types: Int | Float | String | Boolean | ID | DateTime | Date | Enum");
        }

        return value;
    },
    parseValue(value) {
        if (!["string", "number", "boolean"].includes(typeof value)) {
            throw new Error("Value must be one of types: Int | Float | String | Boolean | ID | DateTime | Date | Enum");
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
            case Kind.ENUM:
                return ast.value;
            default:
                throw new Error(
                    "Value must be one of types: Int | Float | String | Boolean | ID | DateTime | Date | Enum"
                );
        }
    },
});

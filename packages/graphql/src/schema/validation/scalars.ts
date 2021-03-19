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

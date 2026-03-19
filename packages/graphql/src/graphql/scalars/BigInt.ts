/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ValueNode } from "graphql";
import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import { int, isInt } from "neo4j-driver";

export const GraphQLBigInt = new GraphQLScalarType({
    name: "BigInt",
    description:
        "A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.",
    serialize(outputValue: unknown) {
        if (isInt(outputValue)) {
            return outputValue.toString(10);
        }

        if (typeof outputValue === "string") {
            return outputValue;
        }

        if (typeof outputValue === "number") {
            return outputValue.toString(10);
        }

        throw new GraphQLError(`BigInt cannot represent value: ${outputValue}`);
    },
    parseValue(inputValue: unknown) {
        if (typeof inputValue !== "string") {
            throw new GraphQLError(
                "BigInt values are not JSON serializable. Please pass as a string in variables, or inline in the GraphQL query."
            );
        }

        try {
            return int(inputValue, { strictStringValidation: true });
        } catch {
            throw new GraphQLError("Value must be either a BigInt, or a string representing a BigInt value.");
        }
    },
    parseLiteral(ast: ValueNode) {
        switch (ast.kind) {
            case Kind.INT:
            case Kind.STRING:
                try {
                    return int(ast.value, { strictStringValidation: true });
                } catch {
                    throw new GraphQLError("Value must be either a BigInt, or a string representing a BigInt value.");
                }
            default:
                throw new GraphQLError("Value must be either a BigInt, or a string representing a BigInt value.");
        }
    },
});

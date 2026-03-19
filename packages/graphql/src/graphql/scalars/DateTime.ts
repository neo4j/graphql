/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ValueNode } from "graphql";
import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import type neo4j from "neo4j-driver";
import { isDateTime } from "neo4j-driver";

export const GraphQLDateTime = new GraphQLScalarType({
    name: "DateTime",
    description: "A date and time, represented as an ISO-8601 string",
    serialize: (outputValue: unknown) => {
        if (typeof outputValue === "string") {
            return new Date(outputValue).toISOString();
        }

        if (isDateTime(outputValue as object)) {
            return new Date((outputValue as typeof neo4j.types.DateTime).toString()).toISOString();
        }

        throw new GraphQLError(`DateTime cannot represent value: ${outputValue}`);
    },
    parseValue: (inputValue: unknown) => {
        if (typeof inputValue === "string") {
            const date = new Date(inputValue);

            if (date.toString() === "Invalid Date") {
                throw new GraphQLError(`DateTime cannot represent non temporal value: ${inputValue}`);
            }

            return inputValue;
        }

        throw new GraphQLError(`DateTime cannot represent non string value: ${inputValue}`);
    },
    parseLiteral(ast: ValueNode) {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError("DateTime cannot represent non string value.");
        }

        return ast.value;
    },
});

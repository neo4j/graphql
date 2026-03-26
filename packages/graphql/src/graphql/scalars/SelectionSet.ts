/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ValueNode } from "graphql";
import { GraphQLError, GraphQLScalarType, Kind, parse } from "graphql";

export const GraphQLSelectionSet = new GraphQLScalarType({
    name: "SelectionSet",
    description:
        "A GraphQL SelectionSet without the outer curly braces. It must be passed as a string and is always returned as a string.",
    serialize(outputValue: unknown) {
        if (typeof outputValue !== "string") {
            throw new GraphQLError(`SelectionSet cannot represent non string value: ${outputValue}`);
        }
        parseSelectionSet(outputValue);

        return outputValue;
    },
    parseValue(inputValue: unknown) {
        if (typeof inputValue !== "string") {
            throw new GraphQLError(`SelectionSet cannot represent non string value: ${inputValue}`);
        }
        parseSelectionSet(inputValue);

        return inputValue;
    },
    parseLiteral(ast: ValueNode) {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError(`SelectionSet cannot represent non string value`);
        }
        parseSelectionSet(ast.value);
        return ast.value;
    },
});

function parseSelectionSet(input: string) {
    try {
        parse(`{ ${input} }`);
    } catch {
        throw new GraphQLError(`SelectionSet cannot parse the following value: ${input}`);
    }
}

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

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
import neo4j from "neo4j-driver";

const TIME_REGEX =
    /^(?<hour>[01]\d|2[0-3]):(?<minute>[0-5]\d)(:(?<second>[0-5]\d)(\.(?<fraction>\d{1}(?:\d{0,8})))?((?:[Zz])|((?<offsetDirection>[-|+])(?<offsetHour>[01]\d|2[0-3]):(?<offsetMinute>[0-5]\d)))?)?$/;

export const validateTime = (value: unknown): string => {
    if (typeof value !== "string") {
        throw new TypeError(`Value must be of type string: ${value}`);
    }

    const match = TIME_REGEX.exec(value);

    if (!match) {
        throw new TypeError(`Value must be formatted as Time: ${value}`);
    }

    return value;
};

export const GraphQLTime = new GraphQLScalarType({
    name: "Time",
    description: "A time, represented as an RFC3339 time string",
    serialize: (value: unknown) => {
        if (typeof value !== "string" && !(value instanceof neo4j.types.Time)) {
            throw new TypeError(`Value must be of type string: ${value}`);
        }

        const stringifiedValue = value.toString();

        if (!TIME_REGEX.test(stringifiedValue)) {
            throw new TypeError(`Value must be formatted as Time: ${stringifiedValue}`);
        }

        return stringifiedValue;
    },
    parseValue: (value: unknown) => {
        return validateTime(value);
    },
    parseLiteral: (ast: ValueNode) => {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError(`Only strings can be validated as Time, but received: ${ast.kind}`);
        }
        return validateTime(ast.value);
    },
});

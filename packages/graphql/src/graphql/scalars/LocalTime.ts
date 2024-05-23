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
import neo4j, { isLocalTime } from "neo4j-driver";

export const LOCAL_TIME_REGEX =
    /^(?<hour>[01]\d|2[0-3]):(?<minute>[0-5]\d):(?<second>[0-5]\d)(\.(?<fraction>\d{1}(?:\d{0,8})))?$/;

type LocalTimeMatchGroups = {
    hour: string;
    minute: string;
    second: string;
    fraction: string | undefined;
};

export const parseLocalTime = (
    value: unknown
): {
    hour: number;
    minute: number;
    second: number;
    nanosecond: number;
} => {
    if (typeof value !== "string") {
        throw new TypeError(`Value must be of type string: ${value}`);
    }

    const match = LOCAL_TIME_REGEX.exec(value);

    if (!match) {
        throw new TypeError(`Value must be formatted as LocalTime: ${value}`);
    }

    const { hour, minute, second, fraction } = match.groups as LocalTimeMatchGroups;

    // Calculate the number of nanoseconds by padding the fraction of seconds with zeroes to nine digits
    let nanosecond = 0;
    if (fraction) {
        nanosecond = +`${fraction}000000000`.substring(0, 9);
    }

    return {
        hour: +hour,
        minute: +minute,
        second: +second,
        nanosecond,
    };
};

const parse = (value: unknown) => {
    if (isLocalTime(value)) {
        return value;
    }

    const { hour, minute, second, nanosecond } = parseLocalTime(value);

    return new neo4j.types.LocalTime(hour, minute, second, nanosecond);
};

export const GraphQLLocalTime = new GraphQLScalarType({
    name: "LocalTime",
    description: "A local time, represented as a time string without timezone information",
    serialize: (value: unknown) => {
        if (typeof value !== "string" && !(value instanceof neo4j.types.LocalTime)) {
            throw new TypeError(`Value must be of type string: ${value}`);
        }

        const stringifiedValue = value.toString();

        if (!LOCAL_TIME_REGEX.test(stringifiedValue)) {
            throw new TypeError(`Value must be formatted as LocalTime: ${stringifiedValue}`);
        }

        return stringifiedValue;
    },
    parseValue: (value: unknown) => {
        return parse(value);
    },
    parseLiteral: (ast: ValueNode) => {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError(`Only strings can be validated as LocalTime, but received: ${ast.kind}`);
        }
        return parse(ast.value);
    },
});

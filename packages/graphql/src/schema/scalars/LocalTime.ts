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
import neo4j from "neo4j-driver";

export const LOCAL_TIME_REGEX = /^(?<hour>[01]\d|2[0-3]):(?<minute>[0-5]\d):(?<second>[0-5]\d)(\.(?<fraction>\d{1}(?:\d{0,8})))?$/;

export const validateLocalTime = (value: any) => {
    if (typeof value !== "string") {
        throw new TypeError(`Value must be of type string: ${value}`);
    }

    if (!LOCAL_TIME_REGEX.test(value)) {
        throw new TypeError(`Value must be formatted as LocalTime: ${value}`);
    }

    return value;
};

export const parseLocalTime = (value: any) => {
    const validatedValue = validateLocalTime(value);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { hour, minute, second, fraction } = LOCAL_TIME_REGEX.exec(validatedValue)!.groups!;

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

const parse = (value: any) => {
    const { hour, minute, second, nanosecond } = parseLocalTime(value);

    return new neo4j.types.LocalTime(hour, minute, second, nanosecond);
};

export default new GraphQLScalarType({
    name: "LocalTime",
    description: "A local time, represented as a time string without timezone information",
    serialize: (value: typeof neo4j.types.LocalTime) => {
        return validateLocalTime(value.toString());
    },
    parseValue: (value) => {
        return parse(value);
    },
    parseLiteral: (ast) => {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError(`Only strings can be validated as LocalTime, but received: ${ast.kind}`);
        }
        return parse(ast.value);
    },
});

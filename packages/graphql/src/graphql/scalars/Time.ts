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
import neo4j, { isTime } from "neo4j-driver";

export const TIME_REGEX =
    /^(?<hour>[01]\d|2[0-3]):(?<minute>[0-5]\d)(:(?<second>[0-5]\d)(\.(?<fraction>\d{1}(?:\d{0,8})))?((?:[Zz])|((?<offsetDirection>[-|+])(?<offsetHour>[01]\d|2[0-3]):(?<offsetMinute>[0-5]\d)))?)?$/;

type TimeRegexMatchGroups = {
    hour: string;
    minute: string;
    second: string;
    fraction: string;
    offsetDirection: string;
    offsetHour: string;
    offsetMinute: string;
};

type ParsedTime = {
    hour: number;
    minute: number;
    second: number;
    nanosecond: number;
    timeZoneOffsetSeconds: number;
};

export const parseTime = (value: unknown): ParsedTime => {
    if (typeof value !== "string") {
        throw new TypeError(`Value must be of type string: ${value}`);
    }

    const match = TIME_REGEX.exec(value);

    if (!match) {
        throw new TypeError(`Value must be formatted as Time: ${value}`);
    }

    const { hour, minute, second, fraction, offsetDirection, offsetHour, offsetMinute } =
        match.groups as TimeRegexMatchGroups;
    // Calculate the number of nanoseconds by padding the fraction of seconds with zeroes to nine digits
    let nanosecond = 0;
    if (fraction) {
        nanosecond = +`${fraction}000000000`.substring(0, 9);
    }

    // Calculate the timeZoneOffsetSeconds by calculating the offset in seconds with the appropriate sign
    let timeZoneOffsetSeconds = 0;
    if (offsetDirection && offsetHour && offsetMinute) {
        const offsetInMinutes = +offsetMinute + +offsetHour * 60;
        const offsetInSeconds = offsetInMinutes * 60;
        timeZoneOffsetSeconds = +`${offsetDirection}${offsetInSeconds}`;
    }

    return {
        hour: +hour,
        minute: +minute,
        second: +(second || 0),
        nanosecond,
        timeZoneOffsetSeconds,
    };
};

const parse = (value: unknown) => {
    if (isTime(value)) {
        return value;
    }

    const { hour, minute, second, nanosecond, timeZoneOffsetSeconds } = parseTime(value);

    return new neo4j.types.Time(hour, minute, second, nanosecond, timeZoneOffsetSeconds);
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
        return parse(value);
    },
    parseLiteral: (ast: ValueNode) => {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError(`Only strings can be validated as Time, but received: ${ast.kind}`);
        }
        return parse(ast.value);
    },
});

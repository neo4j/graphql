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

// Matching YYYY-MM-DDTHH:MM:SS(.sss+)
const LOCAL_DATE_TIME_REGEX = /^(?<year>\d{4})-(?<month>[0]\d|1[0-2])-(?<day>[0-2]\d|3[01])T(?<hour>[01]\d|2[0-3]):(?<minute>[0-5]\d):(?<second>[0-5]\d)(\.(?<fraction>\d+))?$/;

export const parseLocalDateTime = (value: any) => {
    if (typeof value !== "string") {
        throw new TypeError(`Value must be of type string: ${value}`);
    }

    const match = LOCAL_DATE_TIME_REGEX.exec(value);

    if (!match) {
        throw new TypeError(`Value must be formatted as LocalDateTime: ${value}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { year, month, day, hour, minute, second, fraction = 0 } = match.groups!;

    // Take first nine digits if received more
    let nanosecond = `${fraction}`.substring(0, 9);
    // Pad with zeros to reach nine digits if received less
    while (nanosecond.toString().length < 9) {
        nanosecond = `${nanosecond}0`;
    }

    return {
        year: +year,
        month: +month,
        day: +day,
        hour: +hour,
        minute: +minute,
        second: +second,
        nanosecond: +nanosecond,
    };
};

const parse = (value: any) => {
    const { year, month, day, hour, minute, second, nanosecond } = parseLocalDateTime(value);

    return new neo4j.types.LocalDateTime(year, month, day, hour, minute, second, nanosecond);
};

export default new GraphQLScalarType({
    name: "LocalDateTime",
    description: "A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'",
    serialize: (value: any) => {
        if (typeof value !== "string" && !(value instanceof neo4j.types.LocalDateTime)) {
            throw new TypeError(`Value must be of type string: ${value}`);
        }

        const stringifiedValue = value.toString();

        if (!LOCAL_DATE_TIME_REGEX.test(stringifiedValue)) {
            throw new TypeError(`Value must be formatted as LocalDateTime: ${stringifiedValue}`);
        }

        return stringifiedValue;
    },
    parseValue: (value) => {
        return parse(value);
    },
    parseLiteral: (ast) => {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError(`Only strings can be validated as LocalDateTime, but received: ${ast.kind}`);
        }
        return parse(ast.value);
    },
});

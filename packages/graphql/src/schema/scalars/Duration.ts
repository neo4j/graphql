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

const DOCUMENTATION_ADDRESS = "https://neo4j.com/docs/graphql-manual/current/type-definitions/types/#_duration";

export const DECIMAL_VALUE_ERROR = `Cannot specify decimal values in durations, please refer to ${DOCUMENTATION_ADDRESS}`;

// Matching P[nY][nM][nD][T[nH][nM][nS]]  |  PnW  |  PYYYYMMDDTHHMMSS | PYYYY-MM-DDTHH:MM:SS
// For unit based duration a decimal value can only exist on the smallest unit(e.g. P2Y4.5M matches P2.5Y4M does not)
// Similar constraint allows for only decimal seconds on date time based duration
const DURATION_REGEX = /^(?<negated>-?)P(?!$)(?:(?:(?<yearUnit>-?\d+(?:\.\d+(?=Y$))?)Y)?(?:(?<monthUnit>-?\d+(?:\.\d+(?=M$))?)M)?(?:(?<dayUnit>-?\d+(?:\.\d+(?=D$))?)D)?(?:T(?=\d)(?:(?<hourUnit>-?\d+(?:\.\d+(?=H$))?)H)?(?:(?<minuteUnit>-?\d+(?:\.\d+(?=M$))?)M)?(?:(?<secondUnit>-?\d+(?:\.\d+(?=S$))?)S)?)?|(?<weekUnit>-?\d+(?:\.\d+)?)W|(?<yearDT>\d{4})(?<dateDelimiter>-?)(?<monthDT>[0]\d|1[0-2])\k<dateDelimiter>(?<dayDT>\d{2})T(?<hourDT>[01]\d|2[0-3])(?<timeDelimiter>(?:(?<=-\w+?):)|(?<=^-?\w+))(?<minuteDT>[0-5]\d)\k<timeDelimiter>(?<secondDT>[0-5]\d(?:\.\d+)?))$/;

export const parseDuration = (value: any) => {
    if (typeof value !== "string") {
        throw new TypeError(`Value must be of type string: ${value}`);
    }

    const match = DURATION_REGEX.exec(value);

    if (!match) {
        throw new TypeError(`Value must be formatted as Duration: ${value}`);
    }

    const {
        negated,
        // P[nY][nM][nD][T[nH][nM][nS]]
        yearUnit = 0,
        monthUnit = 0,
        dayUnit = 0,
        hourUnit = 0,
        minuteUnit = 0,
        secondUnit = 0,
        // PnW
        weekUnit = 0,
        // PYYYYMMDDTHHMMSS | PYYYY-MM-DDTHH:MM:SS
        yearDT = 0,
        monthDT = 0,
        dayDT = 0,
        hourDT = 0,
        minuteDT = 0,
        secondDT = 0,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    } = match.groups!;

    // Check if any valid duration strings have decimal values unallowed by neo4j-driver
    if (
        !(
            Number.isInteger(+yearUnit) &&
            Number.isInteger(+monthUnit) &&
            Number.isInteger(+weekUnit) &&
            Number.isInteger(+dayUnit)
        )
    ) {
        throw new Error(DECIMAL_VALUE_ERROR);
    }

    // negated duration negates each number including zero: converts -0 -> 0
    const unsignZero = (a: number) => (Object.is(a, -0) ? 0 : a);

    // Splits a floating point second value into whole seconds and nanoseconds
    const splitSeconds = (number: number): [number, number] => {
        // Split on decimal point if needed
        const [second, fraction = 0] = `${number}`.split(".");
        // Take first nine digits if received more
        let nanosecond = `${fraction}`.substring(0, 9);
        // Pad with zeros to reach nine digits if received less
        while (nanosecond.toString().length < 9) {
            nanosecond = `${nanosecond}0`;
        }
        return [+second, +nanosecond];
    };

    // NOTE: xDT and xUnit cannot both be nonzero by construction => (xDT + xUnit) = xDT | xUnit | 0

    const [hourSeconds, hourNanoseconds] = splitSeconds((+hourDT + +hourUnit) * 3600); // 60 * 60 seconds per hour
    const [minuteSeconds, minuteNanoseconds] = splitSeconds((+minuteDT + +minuteUnit) * 60); // 60 seconds per minute
    const [secondSeconds, secondNanoseconds] = splitSeconds(+secondDT + +secondUnit); // 1 second per second

    // Whether total duration is negative
    const coefficient = negated ? -1 : 1;

    // Calculate seconds and nanoseconds based off of hour, minute, and second with decimal values
    const nanoseconds = coefficient * (hourNanoseconds + minuteNanoseconds + secondNanoseconds);
    const seconds = coefficient * (hourSeconds + minuteSeconds + secondSeconds);

    // Calcuate days off of week and day
    const days = coefficient * ((+dayDT + +dayUnit) * 1 + +weekUnit * 7); // 7 days per week

    // Calculate months based off of year and month
    const months = coefficient * ((+monthDT + +monthUnit) * 1 + (+yearDT + +yearUnit) * 12); // 12 months per year

    return {
        months: unsignZero(months),
        days: unsignZero(days),
        seconds: unsignZero(seconds),
        nanoseconds: unsignZero(nanoseconds),
    };
};

const parse = (value: any) => {
    const { months, days, seconds, nanoseconds } = parseDuration(value);

    return new neo4j.types.Duration(months, days, seconds, nanoseconds);
};

export default new GraphQLScalarType({
    name: "Duration",
    description: "A duration, represented as an ISO 8601 duration string",
    serialize: (value: any) => {
        if (typeof value !== "string" && !(value instanceof neo4j.types.Duration)) {
            throw new TypeError(`Value must be of type string: ${value}`);
        }

        const stringifiedValue = value.toString();

        if (!DURATION_REGEX.test(stringifiedValue)) {
            throw new TypeError(`Value must be formatted as Duration: ${stringifiedValue}`);
        }

        return stringifiedValue;
    },
    parseValue: (value) => {
        return parse(value);
    },
    parseLiteral: (ast) => {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError(`Only strings can be validated as Duration, but received: ${ast.kind}`);
        }
        return parse(ast.value);
    },
});

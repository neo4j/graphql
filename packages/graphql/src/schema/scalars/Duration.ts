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

// Matching P[nY][nM][nD][T[nH][nM][nS]]  |  PnW  |  PYYYYMMDDTHHMMSS | PYYYY-MM-DDTHH:MM:SS
// For unit based duration a decimal value can only exist on the smallest unit(e.g. P2Y4.5M matches P2.5Y4M does not)
// Similar constraint allows for only decimal seconds on date time based duration
const DURATION_REGEX = /^(?<negated>-?)P(?!$)(?:(?:(?<yearUnit>-?\d+(?:\.\d+(?=Y$))?)Y)?(?:(?<monthUnit>-?\d+(?:\.\d+(?=M$))?)M)?(?:(?<dayUnit>-?\d+(?:\.\d+(?=D$))?)D)?(?:T(?=-?\d)(?:(?<hourUnit>-?\d+(?:\.\d+(?=H$))?)H)?(?:(?<minuteUnit>-?\d+(?:\.\d+(?=M$))?)M)?(?:(?<secondUnit>-?\d+(?:\.\d+(?=S$))?)S)?)?|(?<weekUnit>-?\d+(?:\.\d+)?)W|(?<yearDT>\d{4})(?<dateDelimiter>-?)(?<monthDT>[0]\d|1[0-2])\k<dateDelimiter>(?<dayDT>\d{2})T(?<hourDT>[01]\d|2[0-3])(?<timeDelimiter>(?:(?<=-\w+?):)|(?<=^-?\w+))(?<minuteDT>[0-5]\d)\k<timeDelimiter>(?<secondDT>[0-5]\d(?:\.\d+)?))$/;

// Normalized components per https://neo4j.com/docs/cypher-manual/current/syntax/operators/#cypher-ordering
const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = 365.2425;
const DAYS_PER_MONTH = DAYS_PER_YEAR / MONTHS_PER_YEAR;
const DAYS_PER_WEEK = 7;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;

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

    // NOTE: xUnit and xDT cannot both be nonzero by construction => (xUnit + xDT) = xUnit | xDT | 0
    const years = +yearUnit + +yearDT;
    const months = +monthUnit + +monthDT;
    const weeks = +weekUnit;
    const days = +dayUnit + +dayDT;
    const hours = +hourUnit + +hourDT;
    const minutes = +minuteUnit + +minuteDT;
    const seconds = +secondUnit + +secondDT;

    // Splits a component into a whole part and remainder
    const splitComponent = (component: number): [number, number] => [
        Math.trunc(component),
        +(component % 1).toPrecision(9),
    ];

    // Calculate months based off of months and years
    const [wholeMonths, remainderMonths] = splitComponent(months + years * MONTHS_PER_YEAR);

    // Calculate days based off of days, weeks, and remainder of months
    const [wholeDays, remainderDays] = splitComponent(days + weeks * DAYS_PER_WEEK + remainderMonths * DAYS_PER_MONTH);

    // Calculate seconds based off of remainder of days, hours, minutes, and seconds
    const splitHoursInSeconds = splitComponent((hours + remainderDays * HOURS_PER_DAY) * SECONDS_PER_HOUR);
    const splitMinutesInSeconds = splitComponent(minutes * SECONDS_PER_MINUTE);
    const splitSeconds = splitComponent(seconds);
    // Total seconds by adding splits of hour minute second
    const [wholeSeconds, remainderSeconds] = splitHoursInSeconds.map(
        (p, i) => p + splitMinutesInSeconds[i] + splitSeconds[i]
    );

    // Calculate nanoseconds based off of remainder of seconds
    const wholeNanoseconds = +remainderSeconds.toFixed(9) * 1000000000;

    // Whether total duration is negative
    const coefficient = negated ? -1 : 1;
    // coefficient of duration and % may negate zero: converts -0 -> 0
    const unsignZero = (a: number) => (Object.is(a, -0) ? 0 : a);

    return {
        months: unsignZero(coefficient * wholeMonths),
        days: unsignZero(coefficient * wholeDays),
        seconds: unsignZero(coefficient * wholeSeconds),
        nanoseconds: unsignZero(coefficient * wholeNanoseconds),
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

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
import neo4j, { isDuration } from "neo4j-driver";

// Matching P[nY][nM][nD][T[nH][nM][nS]]  |  PnW  |  PYYYYMMDDTHHMMSS | PYYYY-MM-DDTHH:MM:SS
// For unit based duration a decimal value can only exist on the smallest unit(e.g. P2Y4.5M matches P2.5Y4M does not)
// Similar constraint allows for only decimal seconds on date time based duration

const DURATION_REGEX_ISO =
    /^(?<negated>-?)?P(?!$)(?:(?<years>-?\d+(?:\.\d+(?=Y$))?)Y)?(?:(?<months>-?\d+(?:\.\d+(?=M$))?)M)?(?:(?<weeks>-?(5[0-3]|[1-4][0-9]|[1-9])(?:\.\d+(?=W$))?)W)?(?:(?<days>-?\d+(?:\.\d+(?=D$))?)D)?(?:T(?!$)(?:(?<hours>-?\d+(?:\.\d+(?=H$))?)H)?(?:(?<minutes>-?\d+(?:\.\d+(?=M$))?)M)?(?:(?<seconds>-?\d+(?:\.\d+(?=S$))?)S)?)?$/;

const DURATION_REGEX_WITH_DELIMITERS =
    /^(?<negated>-?)?P(?<years>\d{4})-(?<months>\d{2})-(?<days>\d{2})T(?<hours>\d{2}):(?<minutes>\d{2}):(?<seconds>\d{2})/;

const DURATION_REGEX_NO_DELIMITERS =
    /^(?<negated>-?)?P(?<years>\d{4})(?<months>\d{2})(?<days>\d{2})T(?<hours>\d{2})(?<minutes>\d{2})(?<seconds>\d{2})/;

// Normalized components per https://neo4j.com/docs/cypher-manual/current/syntax/operators/#cypher-ordering
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = 365.2425;
export const DAYS_PER_MONTH = DAYS_PER_YEAR / MONTHS_PER_YEAR;
export const DAYS_PER_WEEK = 7;
export const HOURS_PER_DAY = 24;
export const MINUTES_PER_HOUR = 60;
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
export const NANOSECONDS_PER_SECOND = 1000000000;

export const parseDuration = (
    value: string
): {
    months: number;
    days: number;
    seconds: number;
    nanoseconds: number;
} => {
    const matchIso = DURATION_REGEX_ISO.exec(value);
    const matchDelimiter = DURATION_REGEX_WITH_DELIMITERS.exec(value);
    const matchNoDelimiter = DURATION_REGEX_NO_DELIMITERS.exec(value);

    const match = matchIso || matchDelimiter || matchNoDelimiter;
    if (!match) {
        throw new TypeError(`Value must be formatted as Duration: ${value}`);
    }

    const {
        negated,
        years: yearUnit = 0,
        months: monthUnit = 0,
        weeks: weekUnit = 0,
        days: dayUnit = 0,
        hours: hourUnit = 0,
        minutes: minuteUnit = 0,
        seconds: secondUnit = 0,
    } = match.groups!;

    const years = +yearUnit;
    const months = +monthUnit;
    const weeks = +weekUnit;
    const days = +dayUnit;
    const hours = +hourUnit;
    const minutes = +minuteUnit;
    const seconds = +secondUnit;

    // Splits a component into a whole part and remainder
    const splitComponent = (component: number): [number, number] => {
        const a = parseFloat(component.toFixed(9));
        return [Math.trunc(a), a % 1];
    };

    // Calculate months based off of months and years
    const [wholeMonths, remainderMonths] = splitComponent(months + years * MONTHS_PER_YEAR);

    // Calculate days based off of days, weeks, and remainder of months
    const [wholeDays, remainderDays] = splitComponent(days + weeks * DAYS_PER_WEEK + remainderMonths * DAYS_PER_MONTH);

    // Calculate seconds based off of remainder of days, hours, minutes, and seconds
    const splitHoursInSeconds = splitComponent((hours + remainderDays * HOURS_PER_DAY) * SECONDS_PER_HOUR);
    const splitMinutesInSeconds = splitComponent(minutes * SECONDS_PER_MINUTE);
    const splitSeconds = splitComponent(seconds);
    // Total seconds by adding splits of hour minute second

    const wholeSeconds = splitHoursInSeconds[0] + splitMinutesInSeconds[0] + splitSeconds[0];
    const remainderSeconds = splitHoursInSeconds[1] + splitMinutesInSeconds[1] + splitSeconds[1];

    // Calculate nanoseconds based off of remainder of seconds
    const wholeNanoseconds = +remainderSeconds.toFixed(9) * NANOSECONDS_PER_SECOND;

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

const parse = (value: unknown) => {
    if (typeof value === "string") {
        const { months, days, seconds, nanoseconds } = parseDuration(value);

        return new neo4j.types.Duration(months, days, seconds, nanoseconds);
    }

    if (isDuration(value)) {
        return value;
    }

    throw new GraphQLError(`Only string or Duration can be validated as Duration, but received: ${value}`);
};

export const GraphQLDuration = new GraphQLScalarType({
    name: "Duration",
    description: "A duration, represented as an ISO 8601 duration string",
    serialize: (value: unknown) => {
        if (!(typeof value === "string" || value instanceof neo4j.types.Duration)) {
            throw new TypeError(`Value must be of type string: ${value}`);
        }

        if (value instanceof neo4j.types.Duration) {
            return value.toString();
        }

        const testIso = DURATION_REGEX_ISO.test(value);
        const testWithDelimiters = DURATION_REGEX_WITH_DELIMITERS.test(value);
        const testNoDelimiters = DURATION_REGEX_NO_DELIMITERS.test(value);
        const isCorrectFormat = testIso || testWithDelimiters || testNoDelimiters;
        if (!isCorrectFormat) {
            throw new TypeError(`Value must be formatted as Duration: ${value}`);
        }

        return value;
    },
    parseValue: (value: unknown) => {
        return parse(value);
    },
    parseLiteral: (ast: ValueNode) => {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError(`Only strings can be validated as Duration, but received: ${ast.kind}`);
        }

        return parse(ast.value);
    },
});

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

// Matching P[nY][nM][nD][T[nH][nM][nS]]  |  P[nW]  |  PYYYYMMDDTHHMMSS[.sss+]
// For unit based duration a fractional value can only exist on the smallest unit(e.g. P2Y4.5M matches P2.5Y4M does not)
// Similar constraint allows for only fractional seconds on date time based duration
const DURATION_REGEX = /^P(?!$)((?<yearUnit>((\d+Y)|(\d+\.\d+Y$)))?(?<monthUnit>((\d+M)|(\d+\.\d+M$)))?(?<dayUnit>((\d+D)|(\d+\.\d+D$)))?(?:T(?=\d)(?<hourUnit>((\d+H)|(\d+\.\d+H$)))?(?<minuteUnit>((\d+M)|(\d+\.\d+M$)))?(?<secondUnit>((\d+S)|(\d+\.\d+S$)))?)?|(?<week>\d+(\.\d+)?)W|(?<yearDT>\d{4})(?<monthDT>[0]\d|1[0-2])(?<dayDT>\d{2})T(?<hourDT>[01]\d|2[0-3])(?<minuteDT>[0-5]\d)(?<secondDT>[0-5]\d)(\.(?<fractionDT>\d+))?)$/;

export const parseDuration = (value: any) => {
    if (typeof value !== "string") {
        throw new TypeError(`Value must be of type string: ${value}`);
    }

    const match = DURATION_REGEX.exec(value);

    if (!match) {
        throw new TypeError(`Value must be formatted as Duration: ${value}`);
    }

    const {
        yearUnit,
        monthUnit,
        dayUnit,
        hourUnit,
        minuteUnit,
        secondUnit,
        week,
        yearDT,
        monthDT,
        dayDT,
        hourDT,
        minuteDT,
        secondDT,
        fractionDT,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    } = match.groups!;

    let months = 0;
    let days = 0;
    let seconds = 0;
    let nanoseconds = 0;

    // DateTime Based
    if (yearDT) {
        months += +yearDT * 12;
    }
    if (monthDT) {
        months += +monthDT;
    }
    if (dayDT) {
        days += +dayDT;
    }
    if (hourDT) {
        seconds += +hourDT * 3600; // 60 * 60 seconds per hour
    }

    if (minuteDT) {
        seconds += +minuteDT * 60; // 60 seconds per minute
    }
    if (secondDT) {
        seconds += +secondDT;
    }
    if (fractionDT) {
        nanoseconds = +`${fractionDT}000000000`.substring(0, 9);
    }

    // Week based
    if (week) {
        days += +week * 7; // 7 days per week
    }

    // Unit based

    if (yearUnit) {
        months += +yearUnit.split("Y")[0] * 12; // 12 months per year
    }
    if (monthUnit) {
        months += +monthUnit.split("M")[0];
    }
    if (dayUnit) {
        days += +dayUnit.split("D")[0];
    }

    // Splits a floating point second value into whole seconds and nanoseconds
    function splitSeconds(number: number): [number, number] {
        // Split on decimal point if needed
        const [second, fraction = 0] = `${number}`.split(".");
        // Take first nine digits if received more
        let nanosecond = `${fraction}`.substring(0, 9);
        // Pad with zeros to reach nine digits if received less
        while (nanosecond.toString().length < 9) {
            nanosecond = `${nanosecond}0`;
        }
        return [+second, +nanosecond];
    }

    // Calculate seconds and nanoseconds based off of hour, minute, and second with fractional values
    if (hourUnit) {
        const hourUnitInSeconds = +hourUnit.split("H")[0] * 3600; // 60 * 60 seconds per hour
        const [wholeSeconds, wholeNanoseconds] = splitSeconds(hourUnitInSeconds);
        seconds += wholeSeconds;
        nanoseconds += wholeNanoseconds;
    }
    if (minuteUnit) {
        const minuteUnitInSeconds = +minuteUnit.split("M")[0] * 60; // 60 seconds per minute
        const [wholeSeconds, wholeNanoSeconds] = splitSeconds(minuteUnitInSeconds);
        seconds += wholeSeconds;
        nanoseconds += wholeNanoSeconds;
    }
    if (secondUnit) {
        const secondUnitInSeconds = +secondUnit.split("S")[0]; // 1 second per second
        const [wholeSeconds, wholeNanoSeconds] = splitSeconds(secondUnitInSeconds);
        seconds += wholeSeconds;
        nanoseconds += wholeNanoSeconds;
    }

    return {
        months,
        days,
        seconds,
        nanoseconds,
    };
};

const parse = (value: any) => {
    const { months, days, seconds, nanoseconds } = parseDuration(value);

    return new neo4j.types.Duration(months, days, seconds, nanoseconds);
};

export default new GraphQLScalarType({
    name: "Duration",
    description: "A duration, represented as an ISO 8601 duration string allowing for basic date time format",
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

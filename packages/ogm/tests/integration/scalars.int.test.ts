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

import { Driver, Session, Date as Neo4jDate, DateTime, Duration, LocalDateTime, LocalTime, Time } from "neo4j-driver";
import { gql } from "graphql-tag";
import neo4j from "./neo4j";
import { OGM } from "../../src";
import { generateUniqueType } from "../utils";

describe("Neo4j native types used with OGM", () => {
    const TestType = generateUniqueType("TestType");

    const typeDefs = gql`
        type ${TestType.name} {
            date: Date
            dateTime: DateTime
            duration: Duration
            localDateTime: LocalDateTime
            localTime: LocalTime
            time: Time
        }
    `;

    let driver: Driver;
    let session: Session;

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("variables can be passed in as Neo4j objects", async () => {
        const ogm = new OGM({ typeDefs, driver });
        const TestTypeModel = ogm.model(TestType.name);

        await ogm.init();

        const standardDate = new Date();

        const date = Neo4jDate.fromStandardDate(standardDate);
        const dateTime = DateTime.fromStandardDate(standardDate);
        const time = Time.fromStandardDate(standardDate);
        const localDateTime = LocalDateTime.fromStandardDate(standardDate);
        const localTime = LocalTime.fromStandardDate(standardDate);
        const duration = new Duration(1, 1, 1, 1);

        const result = await TestTypeModel?.create({
            input: [{ date, dateTime, duration, localDateTime, localTime, time }],
        });

        expect(result[TestType.plural]).toEqual([
            {
                date: new Date((date as unknown as Neo4jDate).toString()).toISOString().split("T")[0],
                dateTime: new Date((dateTime as unknown as DateTime).toString()).toISOString(),
                duration: duration.toString(),
                localDateTime: localDateTime.toString(),
                localTime: localTime.toString(),
                time: time.toString(),
            },
        ]);
    });
});

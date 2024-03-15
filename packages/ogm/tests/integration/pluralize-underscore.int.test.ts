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

import { type Driver, type Session } from "neo4j-driver";
import { generate } from "randomstring";
import { OGM } from "../../src";
import { UniqueType } from "../utils/utils";
import neo4j from "./neo4j";

describe("pluralize with underscore", () => {
    const taskType = new UniqueType("super_task");

    const typeDefs = /* GraphQL */ `
        type ${taskType.name} {
            string: String
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

    test("should create super_task", async () => {
        const ogm = new OGM({ typeDefs, driver });
        const Task = ogm.model(taskType.name);

        await ogm.init();

        const testString = generate({
            charset: "alphabetic",
        });

        const result = await Task.create({ input: [{ string: testString }] });
        expect(result[taskType.plural]).toEqual([{ string: testString }]);

        const reFind = await session.run(
            `
                MATCH (m:${taskType.name} {string: $str})
                RETURN m
            `,
            { str: testString }
        );

        expect(reFind.records[0].toObject().m.properties).toMatchObject({ string: testString });
    });

    test("should find super_task", async () => {
        const ogm = new OGM({ typeDefs, driver });
        const Task = ogm.model(taskType.name);

        await ogm.init();

        const testString = generate({
            charset: "alphabetic",
        });

        await session.run(`
                    CREATE (:${taskType.name} {string: "${testString}"})
                `);

        const result = await Task.find({ where: { string: testString } });
        expect(result).toEqual([{ string: testString }]);
    });
});

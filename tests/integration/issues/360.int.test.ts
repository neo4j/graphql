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

import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/360", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return all nodes when AND is used and members are optional", async () => {
        const type = testHelper.createUniqueType("Event");

        const typeDefs = `
            type ${type.name} {
                id: ID!
                name: String
                start: DateTime
                end: DateTime
                activity: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const query = `
            query ($rangeStart: DateTime, $rangeEnd: DateTime, $activity: String) {
                ${type.plural}(where: { AND: [{ start_GTE: $rangeStart }, { start_LTE: $rangeEnd }, { activity: $activity }] }) {
                    id
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${type.name} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                    CREATE (:${type.name} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                    CREATE (:${type.name} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                `
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[type.plural]).toHaveLength(3);
    });

    test("should return all nodes when OR is used and members are optional", async () => {
        const type = testHelper.createUniqueType("Event");

        const typeDefs = `
            type ${type.name} {
                id: ID!
                name: String
                start: DateTime
                end: DateTime
                activity: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const query = `
            query ($rangeStart: DateTime, $rangeEnd: DateTime, $activity: String) {
                ${type.plural}(where: { OR: [{ start_GTE: $rangeStart }, { start_LTE: $rangeEnd }, { activity: $activity }] }) {
                    id
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${type.name} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                    CREATE (:${type.name} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                    CREATE (:${type.name} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                `
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[type.plural]).toHaveLength(3);
    });

    test("should recreate given test in issue and return correct results", async () => {
        const type = testHelper.createUniqueType("Event");

        const typeDefs = `
            type ${type.name} {
                id: ID!
                name: String
                start: DateTime
                end: DateTime
                activity: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const rangeStart = new Date().toISOString();
        const rangeEnd = new Date().toISOString();

        const query = `
            query ($rangeStart: DateTime, $rangeEnd: DateTime, $activity: String) {
                ${type.plural}(where: { OR: [{ start_GTE: $rangeStart }, { start_LTE: $rangeEnd }, { activity: $activity }] }) {
                    id
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${type.name} {id: randomUUID(), name: randomUUID(), start: datetime($rangeStart), end: datetime($rangeEnd)})
                    CREATE (:${type.name} {id: randomUUID(), name: randomUUID(), start: datetime($rangeStart), end: datetime($rangeEnd)})
                    CREATE (:${type.name} {id: randomUUID(), name: randomUUID(), start: datetime(), end: datetime()})
                `,
            { rangeStart, rangeEnd }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { rangeStart, rangeEnd },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[type.plural]).toHaveLength(3);
    });
});

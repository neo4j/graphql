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

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/560", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should not throw when Point is null", async () => {
        const testLog = testHelper.createUniqueType("Log");

        const typeDefs = gql`
            type ${testLog.name} {
                id: ID!
                location: Point
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const logId = generate({
            charset: "alphabetic",
        });

        const query = `
            query {
                ${testLog.plural} {
                  id
                  location {
                    longitude
                    latitude
                    height
                    crs
                    srid
                  }
                }
            }
        `;

        await testHelper.executeCypher(`
                CREATE (j:${testLog.name} { id: "${logId}" })
            `);

        const result = await testHelper.executeGraphQL(query);

        if (result.errors) {
            console.log(JSON.stringify(result.errors, null, 2));
        }

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            [testLog.plural]: [
                {
                    id: logId,
                    location: null,
                },
            ],
        });
    });

    test("should not throw when CartesianPoint is null", async () => {
        const testLog = testHelper.createUniqueType("Log");

        const typeDefs = gql`
            type ${testLog.name} {
                id: ID!
                location: CartesianPoint
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const logId = generate({
            charset: "alphabetic",
        });

        const query = `
            query {
                ${testLog.plural} {
                  id
                  location {
                    x
                    y
                    z
                    crs
                    srid
                  }
                }
            }
        `;

        await testHelper.executeCypher(`
                CREATE (j:${testLog.name} { id: "${logId}" })
            `);

        const result = await testHelper.executeGraphQL(query);

        if (result.errors) {
            console.log(JSON.stringify(result.errors, null, 2));
        }

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            [testLog.plural]: [
                {
                    id: logId,
                    location: null,
                },
            ],
        });
    });
});

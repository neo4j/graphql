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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/560", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not throw when Point is null", async () => {
        const session = driver.session();

        const testLog = generateUniqueType("Log");

        const typeDefs = gql`
            type ${testLog.name} {
                id: ID!
                location: Point
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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

        try {
            await session.run(`
                CREATE (j:${testLog.name} { id: "${logId}" })
            `);

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

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
        } finally {
            await session.close();
        }
    });

    test("should not throw when CartesianPoint is null", async () => {
        const session = driver.session();

        const testLog = generateUniqueType("Log");

        const typeDefs = gql`
            type ${testLog.name} {
                id: ID!
                location: CartesianPoint
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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

        try {
            await session.run(`
                CREATE (j:${testLog.name} { id: "${logId}" })
            `);

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

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
        } finally {
            await session.close();
        }
    });
});

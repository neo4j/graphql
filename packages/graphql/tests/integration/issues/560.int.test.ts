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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/560", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not throw when Point is null", async () => {
        const testLog = new UniqueType("Log");

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

        await session.run(`
                CREATE (j:${testLog.name} { id: "${logId}" })
            `);

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
    });

    test("should not throw when CartesianPoint is null", async () => {
        const testLog = new UniqueType("Log");

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

        await session.run(`
                CREATE (j:${testLog.name} { id: "${logId}" })
            `);

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
    });
});

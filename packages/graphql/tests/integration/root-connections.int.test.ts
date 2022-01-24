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
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("root-connections", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return an empty array of edges and a totalCount of zero when there are no records", async () => {
        const session = driver.session();

        const typeDefs = `
      type Pilot {
        name: String
        aircraft: [Aircraft!]! @relationship(type: "FLIES_IN", direction: IN)
      }

      type Aircraft {
        id: ID!
        name: String!
        pilots: [Pilot!]! @relationship(type: "FLIES_IN", direction: OUT)
      }
    `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
          query {
            aircraftConnection {
              totalCount
              edges {
                cursor
                node {
                  id
                }
              }
            }
          }
      `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: {},
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(result.errors).toBeFalsy();
            expect(result?.data?.aircraftConnection).toEqual({
                totalCount: 0,
                edges: [],
            });
        } finally {
            await session.close();
        }
    });
    test("should return an array of edges and the correct totalCount", async () => {
        const session = driver.session();

        const typeDefs = `
      type Pilot {
        name: String
        aircraft: [Aircraft!]! @relationship(type: "FLIES_IN", direction: IN)
      }

      type Aircraft {
        id: ID!
        name: String!
        pilots: [Pilot!]! @relationship(type: "FLIES_IN", direction: OUT)
      }
    `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const dummyAircrafts = [...Array(20).keys()].map((x) => ({
            id: generate({ charset: "alphabetic " }),
            name: generate({ charset: "alphabetic" }),
        }));

        const query = `
          query {
            aircraftConnection {
              totalCount
              edges {
                cursor
                node {
                  id
                  name
                }
              }
            }
          }
      `;

        const create = `
        mutation($input: [AircraftCreateInput!]!) {
          createAircraft(input: $input) {
            aircraft {
              id
            }
          }
        }
      `;

        try {
            await neoSchema.checkNeo4jCompat();

            await graphql({
                schema: neoSchema.schema,
                source: create,
                variableValues: { input: dummyAircrafts },
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: {},
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(result.errors).toBeFalsy();
            expect(result?.data?.aircraftConnection).toEqual({
                totalCount: 20,
                edges: dummyAircrafts.map((node) => ({
                    cursor: expect.any(String),
                    node,
                })),
            });
        } finally {
            await session.run(`
              MATCH (a:Aircraft)
              DETACH DELETE a
            `);

            await session.close();
        }
    });
});

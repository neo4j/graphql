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
import { generateUniqueType } from "../utils/graphql-types";

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

        const pilotType = generateUniqueType("Pilot");
        const aircraftType = generateUniqueType("Aircraft");

        const typeDefs = `
          type ${pilotType.name} {
            name: String
            aircraft: [${aircraftType.name}!]! @relationship(type: "FLIES_IN", direction: IN)
          }

          type ${aircraftType.name} {
            id: ID!
            name: String!
            pilots: [${pilotType.name}!]! @relationship(type: "FLIES_IN", direction: OUT)
          }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
          query {
            ${aircraftType.operations.connection} {
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
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(result.errors).toBeFalsy();
            expect(result?.data?.[aircraftType.operations.connection]).toEqual({
                totalCount: 0,
                edges: [],
            });
        } finally {
            await session.close();
        }
    });
    test("should return an array of edges and the correct totalCount", async () => {
        const session = driver.session();

        const pilotType = generateUniqueType("Pilot");
        const aircraftType = generateUniqueType("Aircraft");

        const typeDefs = `
      type ${pilotType.name} {
        name: String
        aircraft: [${aircraftType.name}!]! @relationship(type: "FLIES_IN", direction: IN)
      }

      type ${aircraftType.name} {
        id: ID!
        name: String!
        pilots: [${pilotType.name}!]! @relationship(type: "FLIES_IN", direction: OUT)
      }
    `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const dummyAircrafts = [...Array(20).keys()].map((x) => ({
            id: generate({ charset: "alphabetic " }),
            name: generate({ charset: "alphabetic" }),
        }));

        const query = `
          query {
            ${aircraftType.operations.connection} {
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
        mutation($input: [${aircraftType.name}CreateInput!]!) {
          ${aircraftType.operations.create}(input: $input) {
          ${aircraftType.plural} {
              id
            }
          }
        }
      `;

        try {
            await neoSchema.checkNeo4jCompat();

            await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                variableValues: { input: dummyAircrafts },
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(result.errors).toBeFalsy();
            expect(result?.data?.[aircraftType.operations.connection]).toEqual({
                totalCount: 20,
                edges: dummyAircrafts.map((node) => ({
                    cursor: expect.any(String),
                    node,
                })),
            });
        } finally {
            await session.run(`
              MATCH (a:${aircraftType.name})
              DETACH DELETE a
            `);

            await session.close();
        }
    });
});

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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { UniqueType } from "../utils/graphql-types";

describe("root-connections", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;

    const pilotType = new UniqueType("Pilot");
    const aircraftType = new UniqueType("Aircraft");

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

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        await neoSchema.checkNeo4jCompat();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return an empty array of edges and a totalCount of zero when there are no records", async () => {
        const session = await neo4j.getSession();

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
            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
        const session = await neo4j.getSession();

        const dummyAircrafts = [...Array(20).keys()].map(() => ({
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
            await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                variableValues: { input: dummyAircrafts },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeFalsy();
            expect(result?.data?.[aircraftType.operations.connection]).toEqual({
                totalCount: 20,
                edges: expect.toIncludeAllMembers(
                    dummyAircrafts.map((node) => ({
                        cursor: expect.any(String),
                        node,
                    })),
                ),
            });
        } finally {
            await session.run(`
              MATCH (a:${aircraftType.name})
              DETACH DELETE a
            `);

            await session.close();
        }
    });
    test("should correctly produce edges when sort and limit are used", async () => {
        const session = await neo4j.getSession();

        const dummyAircrafts = [...Array(20).keys()].map(() => ({
            id: generate({ charset: "alphabetic", readable: true }),
            name: generate({ charset: "alphabetic", readable: true }),
        }));

        const sortedAircrafts = dummyAircrafts.sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });

        const query = `
        query {
          ${aircraftType.operations.connection}(first: 10, sort: [{ name: ASC }]) {
            totalCount
            edges {
              cursor
              node {
                id
                name
              }
            }
            pageInfo {
              hasNextPage
              endCursor
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
            await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                variableValues: { input: dummyAircrafts },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeFalsy();
            expect(result?.data?.[aircraftType.operations.connection]).toEqual({
                totalCount: 20,
                edges: sortedAircrafts.slice(0, 10).map((node) => ({
                    cursor: expect.any(String),
                    node,
                })),
                pageInfo: {
                    hasNextPage: true,
                    endCursor: "YXJyYXljb25uZWN0aW9uOjk=",
                },
            });
        } finally {
            await session.run(`
            MATCH (a:${aircraftType.name})
            DETACH DELETE a
          `);

            await session.close();
        }
    });
    test("should calculate the correct cursors when the first argument is provided as a parameter", async () => {
        const session = await neo4j.getSession();

        const dummyAircrafts = [...Array(20).keys()].map(() => ({
            id: generate({ charset: "alphabetic", readable: true }),
            name: generate({ charset: "alphabetic", readable: true }),
        }));

        const sortedAircrafts = dummyAircrafts.sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });

        const query = `
        query($first: Int) {
          ${aircraftType.operations.connection}(first: $first) {
            totalCount
            edges {
              cursor
              node {
                id
                name
              }
            }
            pageInfo {
              hasNextPage
              endCursor
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
            await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                variableValues: { input: dummyAircrafts },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { first: 10 },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeFalsy();
            expect(result?.data?.[aircraftType.operations.connection]).toEqual({
                totalCount: 20,
                edges: sortedAircrafts.slice(0, 10).map((node) => ({
                    cursor: expect.any(String),
                    node,
                })),
                pageInfo: {
                    hasNextPage: true,
                    endCursor: "YXJyYXljb25uZWN0aW9uOjk=",
                },
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

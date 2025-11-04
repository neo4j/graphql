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

import { generate } from "randomstring";
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("root-connections", () => {
    const testHelper: TestHelper = new TestHelper();

    let pilotType: UniqueType;
    let aircraftType: UniqueType;

    beforeEach(async () => {
        pilotType = testHelper.createUniqueType("Pilot");
        aircraftType = testHelper.createUniqueType("Aircraft");

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

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return an empty array of edges and a totalCount of zero when there are no records", async () => {
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

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[aircraftType.operations.connection]).toEqual({
            totalCount: 0,
            edges: [],
        });
    });
    test("should return an array of edges and the correct totalCount", async () => {
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

        await testHelper.executeGraphQL(create, {
            variableValues: { input: dummyAircrafts },
        });

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[aircraftType.operations.connection]).toEqual({
            totalCount: 20,
            edges: expect.toIncludeAllMembers(
                dummyAircrafts.map((node) => ({
                    cursor: expect.any(String),
                    node,
                }))
            ),
        });
    });
    test("should correctly produce edges when sort and limit are used", async () => {
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

        await testHelper.executeGraphQL(create, {
            variableValues: { input: dummyAircrafts },
        });

        const result = await testHelper.executeGraphQL(query);

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
    });
    test("should calculate the correct cursors when the first argument is provided as a parameter", async () => {
        const dummyAircrafts = [...Array(20).keys()].map(() => ({
            id: generate({ charset: "alphabetic", readable: true }),
            name: generate({ charset: "alphabetic", readable: true }),
        }));

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

        await testHelper.executeGraphQL(create, {
            variableValues: { input: dummyAircrafts },
        });

        const result = await testHelper.executeGraphQL(query, {
            variableValues: { first: 10 },
        });

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[aircraftType.operations.connection]).toEqual({
            totalCount: 20,
            edges: expect.toBeArrayOfSize(10),
            pageInfo: {
                hasNextPage: true,
                endCursor: "YXJyYXljb25uZWN0aW9uOjk=",
            },
        });
    });
});

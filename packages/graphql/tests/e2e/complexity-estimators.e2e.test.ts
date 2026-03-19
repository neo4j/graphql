/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { parse } from "graphql";
import { TestHelper } from "../utils/tests-helper";
import type { TestGraphQLServer } from "./setup/apollo-server";
import { ApolloTestServer } from "./setup/apollo-server";

describe("limitRequired enabled", () => {
    const testHelper = new TestHelper();

    let server: TestGraphQLServer;

    beforeAll(async () => {
        const typeDefs = `
                interface Production {
                    title: String
                    actors: [Actor!]! @declareRelationship
                }
                type Movie implements Production @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    directors: [Actor!]! @relationship(type: "DIRECTED", direction: IN)
                }
                type Actor @node {
                    name: String
                }
         `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { limitRequired: true, complexityEstimators: true },
        });

        server = new ApolloTestServer(
            neoSchema,
            // eslint-disable-next-line @typescript-eslint/require-await
            async ({ req }) => ({
                sessionConfig: {
                    database: testHelper.database,
                },
                token: req.headers.authorization,
            }),
            true
        );
        await server.start();
    });

    afterAll(async () => {
        await testHelper.close();
        await server.close();
    });

    test("movies  result", async () => {
        const complexity = await server.computeQueryComplexity(
            parse(`
          query {
            movies(limit: 9) {
              title
            }
          }
      `)
        );
        expect(complexity).toBe(10);
    });

    test("movies with actors result", async () => {
        const complexity = await server.computeQueryComplexity(
            parse(`
            query {
              movies(limit: 5) {
                title
                actors(limit: 6) {
                  name
                }
              }
            }
        `)
        );
        expect(complexity).toBe(13);
    });

    test("movies with actors and directors result", async () => {
        const complexity = await server.computeQueryComplexity(
            parse(`
            query {
              movies(limit: 5) {
                title
                actors(limit: 10) {
                  name
                }
                directors(limit: 4) {
                  name
                }
              }
            }
      `)
        );
        expect(complexity).toBe(22);
    });

    test("productions with actors and directors result", async () => {
        const complexity = await server.computeQueryComplexity(
            parse(`
            query {
              productions(limit: 5) {
                title
                actors(limit: 10) {
                  name
                }
              }
            }
        `)
        );
        expect(complexity).toBe(17);
    });
});

describe("limitRequired not enabled", () => {
    const testHelper = new TestHelper();

    let server: TestGraphQLServer;

    beforeAll(async () => {
        const typeDefs = `
              interface Production {
                  title: String
                  actors: [Actor!]! @declareRelationship
              }
              type Movie implements Production @node {
                  title: String
                  actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                  directors: [Actor!]! @relationship(type: "DIRECTED", direction: IN)
              }
              type Actor @node {
                  name: String
              }
       `;

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs, features: { complexityEstimators: true } });

        server = new ApolloTestServer(
            neoSchema,
            // eslint-disable-next-line @typescript-eslint/require-await
            async ({ req }) => ({
                sessionConfig: {
                    database: testHelper.database,
                },
                token: req.headers.authorization,
            }),
            true
        );
        await server.start();
    });

    afterAll(async () => {
        await testHelper.close();
        await server.close();
    });

    test("movies with actors and directors result - no limit args", async () => {
        const complexity = await server.computeQueryComplexity(
            parse(`
        query {
          movies {
            title
            actors {
              name
            }
            directors {
              name
            }
          }
        }
  `)
        );
        expect(complexity).toBe(6);
    });

    test("productions with actors and directors result - no limit args", async () => {
        const complexity = await server.computeQueryComplexity(
            parse(`
        query {
          productions {
            title
            actors {
              name
            }
          }
        }
    `)
        );
        expect(complexity).toBe(4);
    });
});

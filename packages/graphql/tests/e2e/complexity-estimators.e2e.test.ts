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
                    actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                    directors: [Actor!]! @relationship(type: "DIRECTED", direction: IN)
                }
                type Series implements Production @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedInSeries", direction: IN)
                }
                type Actor @node {
                    name: String
                    movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
                }
                type ActedIn @relationshipProperties {
                    roles: [String!]!
                }
                type ActedInSeries @relationshipProperties {
                    roles: [String!]!
                    episodes: [Int!]!
                    year: Int
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

    test("movies result", async () => {
        const complexity = await server.computeQueryComplexity(
            parse(`
          query {
            movies(limit: 9) {  # 9 * 1 + 1
              title             # 1
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
              movies(limit: 5) {    # (7 + 1) * 5 + 1 = 41
                title               # 1
                actors(limit: 6) {  # 6 * 1 + 1 = 7
                  name              # 1
                }
              }
            }
        `)
        );
        expect(complexity).toBe(41);
    });

    test("movies with actors and directors result", async () => {
        const complexity = await server.computeQueryComplexity(
            parse(`
            query {
              movies(limit: 5) {        # (5 + 11 + 1) * 5 + 1 = 86
                title                   # 1         
                actors(limit: 10) {     # (10 * 1) + 1 = 11
                  name                  # 1
                }
                directors(limit: 4) {   # (4 * 1) + 1 = 5
                  name                  # 1
                }
              }
            }
      `)
        );
        expect(complexity).toBe(86);
    });

    test("movies with actors with nested movies result", async () => {
        const complexity = await server.computeQueryComplexity(
            parse(`
            query {
              movies(limit: 5) {      # (31 + 1) * 5 + 1 = 161
                title                 # 1
                actors(limit: 6) {    # (4 + 1) * 6 + 1 = 31
                  name                # 1
                  movies(limit: 3) {  # (3 * 1) + 1 = 4
                    title             # 1
                  }
                }
              }
            }
        `)
        );
        expect(complexity).toBe(161);
    });

    test("productions with actors and directors result", async () => {
        const complexity = await server.computeQueryComplexity(
            parse(`
            query {
              productions(limit: 5) { # (11 + 1) * 5) + 1 = 61
                title                 # 1 
                actors(limit: 10) {   # (10 * 1) + 1 = 11
                  name                # 1
                }
              }
            }
        `)
        );
        expect(complexity).toBe(61);
    });
    test("connection query with fragments", async () => {
        const document = parse(`
            query {
              productionsConnection(first: 10, sort: [{ title: ASC }]) {           # (12 + 2x) * 10 + 1 = 121 + 20x
                edges {              # 12 + 2x
                  node {             # 9 + 2x + 1 + 1 = 11 + 2x
                    title            # 1              
                    actorsConnection(first: 2, sort: { node: { name: ASC } }) {    # (4+x)*2+1 = 9 + 2x
                      edges {        # 3 + x + 1 = 4 + x
                        node {       # 2
                          name       # 1
                        }
                        properties { # 1 + x; x = max nr of properties in below fragments
                          ... on ActedIn {
                            roles
                          }
                          ... on ActedInSeries {
                            roles
                            episodes
                            year
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
        `);
        const complexity = await server.computeQueryComplexity(document);
        expect(complexity).toBe(181);
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
                  movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
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

    test("movies with actors with nested movies result", async () => {
        const complexity = await server.computeQueryComplexity(
            parse(`
            query {
              movies {      
                title                 
                actors {    
                  name                
                  movies {  
                    title             
                  }
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

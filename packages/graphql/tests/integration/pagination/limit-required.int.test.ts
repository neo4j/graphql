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
import { TestHelper } from "../../utils/tests-helper";
import { GraphQLError } from "graphql";

const testLabel = generate({ charset: "alphabetic" });

describe("Limit required", () => {
    const testHelper = new TestHelper();
    const movieType = testHelper.createUniqueType("Movie");
    const seriesType = testHelper.createUniqueType("Series");
    const actorType = testHelper.createUniqueType("Actor");

    const typeDefs = /* GraphQL */ `
        interface Production {
            id: ID!
            title: String!
        }
        type ${movieType} implements Production @node {
            id: ID!
            title: String!
            runtime: Int!
            actors: [${actorType}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
        }
        type ${seriesType} implements Production @node {
            id: ID!
            title: String!
            episodes: Int!
        }
        interface Person {
            id: ID!
            name: String!
            actedIn: [Production!]! @declareRelationship
            contact: [Contact!]! @declareRelationship
        }
        union Contact = Telephone | Email
        type Telephone @node {
            number: String!
        }
        type Email @node {
            address: String!
        }
        type ${actorType} implements Person @node {
            id: ID!
            name: String!
            movies: [${movieType}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            contact: [Contact!]! @relationship(type: "HAS_CONTACT", direction: OUT)
        }
        type ActedIn @relationshipProperties {
            screenTime: Int!
        }
    `;

    const movies = [
        {
            id: generate({ charset: "alphabetic" }),
            title: "A",
            runtime: 400,
        },
        {
            id: generate({ charset: "alphabetic" }),
            title: "B",
            runtime: 300,
        },
    ] as const;

    const series = [
        {
            id: generate({ charset: "alphabetic" }),
            title: "C",
            episodes: 200,
        },
        {
            id: generate({ charset: "alphabetic" }),
            title: "D",
            episodes: 100,
        },
    ] as const;

    const actors = [
        {
            id: generate({ charset: "alphabetic" }),
            name: `A${generate({ charset: "alphbetic" })}`,
            screenTime: {
                [movies[0].id]: 2,
                [movies[1].id]: 1,
                [series[0].id]: 6,
                [series[1].id]: 4,
            },
            emailAddress: "a@mail.com",
        },
        {
            id: generate({ charset: "alphabetic" }),
            name: `B${generate({ charset: "alphbetic" })}`,
            screenTime: {
                [movies[1].id]: 1,
            },
            phoneNumber:"123456",
        },
    ] as const;

    beforeAll(async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                limitRequired: true,
            },
        });

        await testHelper.executeCypher(
            `
                    CREATE (m1:${movieType}:${testLabel}) SET m1 = $movies[0]
                    CREATE (m2:${movieType}:${testLabel}) SET m2 = $movies[1]
                    CREATE (s1:${seriesType}:${testLabel}) SET s1 = $series[0]
                    CREATE (s2:${seriesType}:${testLabel}) SET s2 = $series[1]

                    CREATE (a1:${actorType}:${testLabel}) SET a1.id = $actors[0].id, a1.name = $actors[0].name
                    CREATE (a2:${actorType}:${testLabel}) SET a2.id = $actors[1].id, a2.name = $actors[1].name

                    MERGE (a1)-[:ACTED_IN {screenTime: $actors[0].screenTime[m1.id]}]->(m1)
                    MERGE (a1)-[:ACTED_IN {screenTime: $actors[0].screenTime[m1.id]}]->(m1)
                    MERGE (a1)-[:ACTED_IN {screenTime: $actors[0].screenTime[m2.id]}]->(m2)<-[:ACTED_IN {screenTime: $actors[1].screenTime[m2.id]}]-(a2)
                    MERGE (s1)<-[:ACTED_IN {screenTime: $actors[0].screenTime[s1.id]}]-(a1)-[:ACTED_IN {screenTime: $actors[0].screenTime[s2.id]}]->(s2)
                    
                    MERGE (mail: Email {address: $actors[0].emailAddress})
                    MERGE (phone: Phone {number: $actors[1].phoneNumber})
                    MERGE (a1)-[:HAS_CONTACT]->(mail)
                    MERGE (a2)-[:HAS_CONTACT]->(phone)
                `,
            { movies, series, actors }
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    describe("simple query field on object types", () => {
        test("limit argument provided", async () => {
            const query = /* GraphQL */ `
                query {
                    ${movieType.plural}(limit: 1, sort: {title: ASC}) {
                        title
                        actors(limit: 1, sort: {name: ASC}) {
                            name
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[movieType.plural]).toEqual([{ actors: [{ name: actors[0].name }], title: "A" }]);
        });

        test("limit argument not provided", async () => {
            const query = /* GraphQL */ `
                query {
                    ${movieType.plural} {
                        actors {
                            name
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(2);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "${movieType.plural}" argument "limit" of type "Int!" is required, but it was not provided.`),
                new GraphQLError(`Field "actors" argument "limit" of type "Int!" is required, but it was not provided.`),
             ]);
        });

        test("limit argument provided only root level", async () => {
            const query = /* GraphQL */ `
                query {
                    ${movieType.plural}(limit: 1) {
                        actors {
                            name
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "actors" argument "limit" of type "Int!" is required, but it was not provided.`),
             ]);
        });
    });
    describe("simple query field on object types - relationship to interface", () => {
        test("limit argument provided", async () => {
            const query = /* GraphQL */ `
                query {
                    ${actorType.plural}(limit: 1, sort: {name: ASC}) {
                        name
                        actedIn(limit: 1, sort: {title: ASC}) {
                            title
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[actorType.plural]).toEqual([{ actedIn: [{ title: "A"}], name: actors[0].name  }]);
        });

        test("limit argument not provided", async () => {
            const query = /* GraphQL */ `
                query {
                    ${actorType.plural} {
                        actedIn {
                            title
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(2);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "${actorType.plural}" argument "limit" of type "Int!" is required, but it was not provided.`),
                new GraphQLError(`Field "actedIn" argument "limit" of type "Int!" is required, but it was not provided.`),
             ]);
        });

        test("limit argument provided only root level", async () => {
            const query = /* GraphQL */ `
                query {
                    ${actorType.plural}(limit: 1) {
                        actedIn {
                            title
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "actedIn" argument "limit" of type "Int!" is required, but it was not provided.`),
             ]);
        });
    });
    describe("simple query field on object types - relationship to union", () => {
        test("limit argument provided", async () => {
            const query = /* GraphQL */ `
                query {
                     ${actorType.plural}(limit: 1, sort: {name: ASC}) {
                        name
                        contact(limit: 1) {
                            ... on Telephone {
                                number
                            }
                            ... on Email {
                                address
                            }
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[ actorType.plural]).toEqual([{ contact: [{ address: "a@mail.com"}], name: actors[0].name  }]);
        });

        test("limit argument not provided", async () => {
            const query = /* GraphQL */ `
                query {
                     ${actorType.plural} {
                         contact{
                            ... on Telephone {
                                number
                            }
                            ... on Email {
                                address
                            }
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(2);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "${actorType.plural}" argument "limit" of type "Int!" is required, but it was not provided.`),
                new GraphQLError(`Field "contact" argument "limit" of type "Int!" is required, but it was not provided.`),
             ]);
        });

        test("limit argument provided only root level", async () => {
            const query = /* GraphQL */ `
                query {
                     ${actorType.plural}(limit: 1) {
                         contact {
                            ... on Telephone {
                                number
                            }
                            ... on Email {
                                address
                            }
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "contact" argument "limit" of type "Int!" is required, but it was not provided.`),
             ]);
        });
    });
    describe("simple query field on object types - interface relationship to another interface", () => {
        test("limit argument provided", async () => {
            const query = /* GraphQL */ `
                query {
                    people(limit: 1, sort: {name: ASC}) {
                        name
                        actedIn(limit: 1, sort: {title: ASC}) {
                            title
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)["people"]).toEqual([{ actedIn: [{ title: "A"}], name: actors[0].name  }]);
        });

        test("limit argument not provided", async () => {
            const query = /* GraphQL */ `
                query {
                    people {
                        actedIn {
                            title
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(2);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "people" argument "limit" of type "Int!" is required, but it was not provided.`),
                new GraphQLError(`Field "actedIn" argument "limit" of type "Int!" is required, but it was not provided.`),
             ]);
        });

        test("limit argument provided only root level", async () => {
            const query = /* GraphQL */ `
                query {
                    people(limit: 1) {
                        actedIn {
                            title
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "actedIn" argument "limit" of type "Int!" is required, but it was not provided.`),
             ]);
        });
    });
    describe("simple query field on object types - interface relationship to union", () => {
        test("limit argument provided", async () => {
            const query = /* GraphQL */ `
                query {
                    people(limit: 1, sort: {name: ASC}) {
                        name
                        contact(limit: 1) {
                            ... on Telephone {
                                number
                            }
                            ... on Email {
                                address
                            }
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)["people"]).toEqual([{ contact: [{ address: "a@mail.com"}], name: actors[0].name  }]);
        });

        test("limit argument not provided", async () => {
            const query = /* GraphQL */ `
                query {
                    people {
                         contact{
                            ... on Telephone {
                                number
                            }
                            ... on Email {
                                address
                            }
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(2);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "people" argument "limit" of type "Int!" is required, but it was not provided.`),
                new GraphQLError(`Field "contact" argument "limit" of type "Int!" is required, but it was not provided.`),
             ]);
        });

        test("limit argument provided only root level", async () => {
            const query = /* GraphQL */ `
                query {
                    people(limit: 1) {
                         contact {
                            ... on Telephone {
                                number
                            }
                            ... on Email {
                                address
                            }
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "contact" argument "limit" of type "Int!" is required, but it was not provided.`),
             ]);
        });
    });
    describe("connection query field on object types", () => {
        test("limit argument provided", async () => {
            const query = /* GraphQL */ `
                query {
                    ${movieType.operations.connection}(first: 1, sort: {title: ASC}) {
                        edges {
                            node {
                                title
                                actorsConnection(first: 1, sort: {node: {name: ASC} }) {
                                    edges {
                                        node {
                                            name
                                        }
                                    }
                                }
                            }   
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[movieType.operations.connection]["edges"]).toEqual([
                {
                    node: { actorsConnection: {edges: [{ node: { name: actors[0].name }}]}, title: "A" },
                },
            ]);
        });
        
        test("limit argument not provided", async () => {
            const query = /* GraphQL */ `
                query {
                    ${movieType.operations.connection} {
                        edges {
                            node {
                                title
                                 actorsConnection {
                                    edges {
                                        node {
                                            name
                                        }
                                    }
                                } 
                            }   
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);
      console.log(gqlResult.errors, 0,2)
            expect(gqlResult.errors).toHaveLength(2);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError("Field \"actorsConnection\" argument \"first\" of type \"Int!\" is required, but it was not provided."),
                new GraphQLError(`Field "${movieType.operations.connection}" argument "first" of type "Int!" is required, but it was not provided.`),
            ]);
      
        });

        test("limit argument provided only root level", async () => {
            const query = /* GraphQL */ `
            query {
                ${movieType.operations.connection}(first: 1, sort: {title: ASC}) {
                    edges {
                        node {
                            title
                            actorsConnection {
                                edges {
                                    node {
                                        name
                                    }
                                }
                            } 
                        }   
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);


            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors).toIncludeSameMembers([
               new GraphQLError("Field \"actorsConnection\" argument \"first\" of type \"Int!\" is required, but it was not provided."),
            ]);
        });
    });
    describe("connection query field on object types - relationship to union", () => {
        test("limit argument provided", async () => {
            const query = /* GraphQL */ `
                query {
                     ${actorType.operations.connection}(first: 1, sort: {name: ASC}) {
                        edges { 
                            node { 
                                name 
                                contactConnection(first: 1) {
                                    edges {
                                        node {
                                            ... on Telephone { 
                                                number 
                                            } 
                                            ... on Email { 
                                                address 
                                            } 
                                        }
                                    }
                                } 
                            } 
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[ actorType.operations.connection]["edges"]).toEqual([{ node: { contactConnection: {edges: [{node: { address: "a@mail.com"}}]}, name: actors[0].name  }}]);
        });

        test("limit argument not provided", async () => {
            const query = /* GraphQL */ `
                query {
                    ${actorType.operations.connection} {
                        edges { 
                            node { 
                                name 
                                contactConnection {
                                    edges {
                                        node {
                                            ... on Telephone { 
                                                number 
                                            } 
                                            ... on Email { 
                                                address 
                                            } 
                                        }
                                    }
                                } 
                            } 
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(2);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "${actorType.operations.connection}" argument "first" of type "Int!" is required, but it was not provided.`),
                new GraphQLError(`Field "contactConnection" argument "first" of type "Int!" is required, but it was not provided.`),
             ]);
        });

        test("limit argument provided only root level", async () => {
            const query = /* GraphQL */ `
                query {
                    ${actorType.operations.connection}(first: 1) {
                        edges { 
                            node { 
                                name 
                                contactConnection {
                                    edges {
                                        node {
                                            ... on Telephone { 
                                                number 
                                            } 
                                            ... on Email { 
                                                address 
                                            } 
                                        }
                                    }
                                } 
                            } 
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "contactConnection" argument "first" of type "Int!" is required, but it was not provided.`),
             ]);
        });
    });
    describe("connection query field on object types - interface relationship to another interface", () => {
        test("limit argument provided", async () => {
            const query = /* GraphQL */ `
                query {
                    peopleConnection(first: 1, sort: { name: ASC }) {
                        edges {
                            node {
                                name
                                actedInConnection(first: 1, sort: { node: { title: ASC } }) {
                                    edges {
                                        node {
                                            title
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)["peopleConnection"]["edges"]).toEqual([{node: { actedInConnection: {edges: [{node: {title: "A"}}]}, name: actors[0].name  }}]);
        });

        test("limit argument not provided", async () => {
            const query = /* GraphQL */ `
                query {
                    peopleConnection {
                        edges {
                            node {
                                actedInConnection {
                                    edges {
                                        node {
                                            title
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(2);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "peopleConnection" argument "first" of type "Int!" is required, but it was not provided.`),
                new GraphQLError(`Field "actedInConnection" argument "first" of type "Int!" is required, but it was not provided.`),
             ]);
        });

        test("limit argument provided only root level", async () => {
            const query = /* GraphQL */ `
                query {
                    peopleConnection(first: 1) {
                        edges {
                            node {  
                                actedInConnection {
                                    edges { 
                                        node {
                                            title
                                        }
                                    }
                                }
                            }
                        }   
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "actedInConnection" argument "first" of type "Int!" is required, but it was not provided.`),
             ]);
        });
    });
    describe("connection query field on object types - interface relationship to union", () => {
        test("limit argument provided", async () => {
            const query = /* GraphQL */ `
                query {
                    peopleConnection(first: 1, sort: { name: ASC }) {
                        edges {
                            node {
                                name
                                contactConnection(first: 1) {
                                    edges {
                                        node {  
                                            ... on Telephone {
                                                number
                                            }
                                            ... on Email {
                                                address
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)["peopleConnection"]["edges"]).toEqual([
                {
                    node: { 
                        name: actors[0].name,
                        contactConnection: {
                            edges: [
                                { node: { address: "a@mail.com"}},
                            ],
                        },
                    },
                }]);
        });

        test("limit argument not provided", async () => {
            const query = /* GraphQL */ `
                query {
                    peopleConnection {
                        edges {
                            node {
                                contactConnection{
                                    edges {
                                        node {  
                                            ... on Telephone {
                                                number
                                            }
                                            ... on Email {
                                                address
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(2);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "peopleConnection" argument "first" of type "Int!" is required, but it was not provided.`),
                new GraphQLError(`Field "contactConnection" argument "first" of type "Int!" is required, but it was not provided.`),
             ]);
        });

        test("limit argument provided only root level", async () => {
            const query = /* GraphQL */ `
                query {
                    peopleConnection(first: 1) {
                        edges {
                            node {  
                                contactConnection {
                                    edges {
                                        node {  
                                            ... on Telephone {
                                                number
                                            }
                                            ... on Email {
                                                address
                                            }
                                        }
                                    }
                                }
                            }
                        }   
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "contactConnection" argument "first" of type "Int!" is required, but it was not provided.`),
             ]);
        });
    });
});


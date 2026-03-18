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
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Single Relationships", () => {
    let Person: UniqueType;
    let Movie: UniqueType;
    const testHelper = new TestHelper();

    describe("Queries", () => {
        beforeEach(async () => {
            Person = testHelper.createUniqueType("Person");
            Movie = testHelper.createUniqueType("Movie");

            const typeDefs = /* GraphQL */ `
            type ${Movie}  @node {
                title: String!
                released: Int!
                director: ${Person} @relationship(type: "DIRECTED", direction: IN)
            }
            type ${Person} @node {
                name: String!
                directed: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT)
            }
        `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await testHelper.executeCypher(`
                CREATE (:${Person} {name: "Joel Coen"})-[:DIRECTED]->(:${Movie} {title: "No Country for Old Men", released: 2007})
            `);
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("example 1: Get Movie by title with related Person through DIRECTED relationship", async () => {
            const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { title: { eq: "No Country for Old Men" } }) {
                    title
                    director {
                        name
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Movie.plural]: [
                    {
                        title: "No Country for Old Men",
                        director: {
                            name: "Joel Coen",
                        },
                    },
                ],
            });
        });

        test("example 2: Get Movie nodes filtered by the name of the director through the DIRECTED relationship", async () => {
            // make sure this is not returned
            await testHelper.executeCypher(`
            CREATE (:${Person} {name: "Other Person"})-[:DIRECTED]->(:${Movie} {title: "Other Movie", released: 2007})
        `);
            const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { director: { name: { eq: "Joel Coen" } } }) {
                    title
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Movie.plural]: [
                    {
                        title: "No Country for Old Men",
                    },
                ],
            });
        });
    });

    describe("Mutations", () => {
        beforeEach(async () => {
            Person = testHelper.createUniqueType("Person");
            Movie = testHelper.createUniqueType("Movie");

            const typeDefs = /* GraphQL */ `
            type ${Movie}  @node {
                title: String!
                released: Int!
                director: ${Person} @relationship(type: "DIRECTED", direction: IN)
            }
            type ${Person} @node {
                name: String!
                directed: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT)
            }
        `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("example 3: Create a Movie node and connect it to an inline created Person node through the DIRECTED relationship", async () => {
            const query = /* GraphQL */ `
            mutation CreateActorAndProductions {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: "No Country for Old Men", 
                            released: 2007, 
                            director: { 
                                create: { 
                                    node: { name: "Joel Coen" }
                                } 
                            }  
                        }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Movie.operations.create]: {
                    [Movie.plural]: [
                        {
                            title: "No Country for Old Men",
                        },
                    ],
                },
            });

            await testHelper.expectRelationship(Person, Movie, "DIRECTED").toIncludeSameMembers([
                {
                    from: {
                        name: "Joel Coen",
                    },
                    to: {
                        title: "No Country for Old Men",
                        released: 2007,
                    },
                    relationship: {},
                },
            ]);
        });

        test("example 4: Create a Movie node and connect it to an existing Person node through the DIRECTED relationship", async () => {
            // setup
            await testHelper.executeCypher(`
            CREATE (:${Person} {name: "Joel Coen"})
        `);
            const createQuery = /* GraphQL */ `
            mutation  {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: "No Country for Old Men"
                            released: 2007
                        }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(createQuery);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Movie.operations.create]: {
                    [Movie.plural]: [
                        {
                            title: "No Country for Old Men",
                        },
                    ],
                },
            });

            const connectQuery = /* GraphQL */ `
            mutation  {
                ${Person.operations.update}(
                    where: { name: { eq: "Joel Coen" } }
                    update: { 
                        directed: { 
                            connect: { 
                                where: { node: { title: { eq: "No Country for Old Men" } } }
                            } 
                        } 
                    }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

            const connectResult = await testHelper.executeGraphQL(connectQuery);
            expect(connectResult.errors).toBeUndefined();
            expect(connectResult.data).toEqual({
                [Person.operations.update]: {
                    info: {
                        relationshipsCreated: 1,
                    },
                },
            });

            await testHelper.expectRelationship(Person, Movie, "DIRECTED").toIncludeSameMembers([
                {
                    from: {
                        name: "Joel Coen",
                    },
                    to: {
                        title: "No Country for Old Men",
                        released: 2007,
                    },
                    relationship: {},
                },
            ]);
        });

        test("example 5: Delete Movie and Person nodes that are connected through the DIRECTED relationship", async () => {
            // setup
            await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "No Country for Old Men"})<-[:DIRECTED]-(:${Person} {name: "Joel Coen"})
        `);
            const query = /* GraphQL */ `
            mutation  {
                ${Movie.operations.delete}(
                    where: { title: { eq: "No Country for Old Men" } },
                    delete: {
                        director: { 
                            where: { node: { name: { eq: "Joel Coen" } } }
                        } 
                    }
                ) {
                    nodesDeleted
                    relationshipsDeleted 
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Movie.operations.delete]: {
                    nodesDeleted: 2,
                    relationshipsDeleted: 1,
                },
            });

            await testHelper.expectRelationship(Person, Movie, "DIRECTED").toIncludeSameMembers([]);
        });

        test("example 6: Delete an existing DIRECTED relationship between a Movie and a Person node", async () => {
            // setup
            await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "No Country for Old Men"})<-[:DIRECTED]-(:${Person} {name: "Joel Coen"})
        `);
            const query = /* GraphQL */ `
            mutation  {
                ${Person.operations.update}(
                    where: { name: { eq: "Joel Coen" } }
                    update: {
                        directed: [{
                            disconnect: { 
                                where: { node: { title: { eq: "No Country for Old Men" } } },
                            } 
                        }]
                    }
                ) {
                    info {
                        relationshipsDeleted
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.update]: {
                    info: {
                        relationshipsDeleted: 1,
                    },
                },
            });

            await testHelper.expectRelationship(Person, Movie, "DIRECTED").toIncludeSameMembers([]);
        });

        test("example 7+8: Create a Movie node and connect it to 2 Person nodes through the DIRECTED relationship", async () => {
            // setup
            await testHelper.executeCypher(`
           CREATE (:${Movie} { title: "No Country for Old Men", released: 2007 })
           CREATE (:${Person} { name: "Joel Coen" })
           CREATE (:${Person} { name: "Ethan Coen" })
        `);
            const query = /* GraphQL */ `
            mutation  {
                ${Person.operations.update}(
                    where: { name: { contains: "Coen" } }
                    update: {
                        directed: [{
                            connect: { 
                                where: { node: { title: { eq: "No Country for Old Men" } } },
                            } 
                        }]
                    }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.update]: {
                    info: {
                        relationshipsCreated: 2,
                    },
                },
            });

            await testHelper.expectRelationship(Person, Movie, "DIRECTED").toIncludeSameMembers([
                {
                    from: {
                        name: "Joel Coen",
                    },
                    to: {
                        title: "No Country for Old Men",
                        released: 2007,
                    },
                    relationship: {},
                },
                {
                    from: {
                        name: "Ethan Coen",
                    },
                    to: {
                        title: "No Country for Old Men",
                        released: 2007,
                    },
                    relationship: {},
                },
            ]);
        });

        // TODO: add example of disconnecting a single relationship through top-level update mutation
        // update -> delete
        test.skip("example 9: disconnecting a single relationship", async () => {
            const query = /* GraphQL */ `
            mutation CreateActorAndProductions {
                ${Movie.operations.update}(
                    update: {
                        director: { 
                            delete: {
                                where: { node: { name: { eq: "Ben Affleck" } } }
                         }
                        } 
                    }
                ) {
                    info {
                    relationshipsDeleted
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.create]: {
                    [Person.plural]: [
                        {
                            name: "Ben Affleck",
                        },
                    ],
                },
            });

            await testHelper.expectRelationship(Person, Movie, "ACTED_IN").toIncludeSameMembers([
                {
                    from: {
                        name: "Ben Affleck",
                    },
                    to: {
                        title: "Argo",
                        released: 2012,
                    },
                    relationship: {
                        roles: ["Tony Mendez"],
                    },
                },
                {
                    from: {
                        name: "Ben Affleck",
                    },
                    to: {
                        title: "Gone Girl",
                        released: 2014,
                    },
                    relationship: {
                        roles: ["Nick Dunne"],
                    },
                },
            ]);
        });
    });
});

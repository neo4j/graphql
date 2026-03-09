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

    beforeAll(async () => {
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

    afterAll(async () => {
        await testHelper.close();
    });

    describe("Queries", () => {
        const JoelCoen = `Joel Coen ${generate({
            charset: "alphabetic",
        }).toLowerCase()}`;
        const NoCountryForOldMen = `No Country for Old Men ${generate({
            charset: "alphabetic",
        }).toLowerCase()}`;

        beforeAll(async () => {
            // set-up for queries
            await testHelper.executeCypher(`
                CREATE (:${Person} {name: "${JoelCoen}"})-[:DIRECTED]->(:${Movie} {title: "${NoCountryForOldMen}", released: 2007})
            `);
        });
        test("example 1: Get Movie by title with related Person through DIRECTED relationship", async () => {
            const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { title: { eq: "${NoCountryForOldMen}" } }) {
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
                        title: NoCountryForOldMen,
                        director: {
                            name: JoelCoen,
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
                ${Movie.plural}(where: { director: { name: { eq: "${JoelCoen}" } } }) {
                    title
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Movie.plural]: [
                    {
                        title: NoCountryForOldMen,
                    },
                ],
            });
        });
    });

    describe("Mutations", () => {
        beforeEach(async () => {
            // clean-up for mutations
            await testHelper.executeCypher(`
                MATCH (p:${Person} )
                MATCH (a:${Movie} )
                DETACH DELETE p,a
            `);
        });
        test("example 3: Create a Movie node and connect it to an inline created Person node through the DIRECTED relationship", async () => {
            const JoelCoen = `Joel Coen ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const NoCountryForOldMen = `No Country for Old Men ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;

            const query = /* GraphQL */ `
            mutation CreateActorAndProductions {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: "${NoCountryForOldMen}", 
                            released: 2007, 
                            director: { 
                                create: { 
                                    node: { name: "${JoelCoen}" }
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
                            title: NoCountryForOldMen,
                        },
                    ],
                },
            });

            await testHelper.expectRelationship(Person, Movie, "DIRECTED").toIncludeSameMembers([
                {
                    from: {
                        name: JoelCoen,
                    },
                    to: {
                        title: NoCountryForOldMen,
                        released: 2007,
                    },
                    relationship: {},
                },
            ]);
        });

        test("example 4: Create a Movie node and connect it to an existing Person node through the DIRECTED relationship", async () => {
            const JoelCoen = `Joel Coen ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const NoCountryForOldMen = `No Country for Old Men ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;

            // has to exist
            await testHelper.executeCypher(`
            CREATE (:${Person} {name: "${JoelCoen}"})
        `);
            const createQuery = /* GraphQL */ `
            mutation  {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: "${NoCountryForOldMen}"
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
                            title: NoCountryForOldMen,
                        },
                    ],
                },
            });

            const connectQuery = /* GraphQL */ `
            mutation  {
                ${Person.operations.update}(
                    where: { name: { eq: "${JoelCoen}" } }
                    update: { 
                        directed: { 
                            connect: { 
                                where: { node: { title: { eq: "${NoCountryForOldMen}" } } }
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
                        name: JoelCoen,
                    },
                    to: {
                        title: NoCountryForOldMen,
                        released: 2007,
                    },
                    relationship: {},
                },
            ]);
        });

        test("example 5: Delete Movie and Person nodes that are connected through the DIRECTED relationship", async () => {
            const JoelCoen = `Joel Coen ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const NoCountryForOldMen = `No Country for Old Men ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;

            // setup
            await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "${NoCountryForOldMen}"})<-[:DIRECTED]-(:${Person} {name: "${JoelCoen}"})
        `);
            const query = /* GraphQL */ `
            mutation  {
                ${Movie.operations.delete}(
                    where: { title: { eq: "${NoCountryForOldMen}" } },
                    delete: {
                        director: { 
                            where: { node: { name: { eq: "${JoelCoen}" } } }
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
            const JoelCoen = `Joel Coen ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const NoCountryForOldMen = `No Country for Old Men ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;

            // setup
            await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "${NoCountryForOldMen}"})<-[:DIRECTED]-(:${Person} {name: "${JoelCoen}"})
        `);
            const query = /* GraphQL */ `
            mutation  {
                ${Person.operations.update}(
                    where: { name: { eq: "${JoelCoen}" } }
                    update: {
                        directed: [{
                            disconnect: { 
                                where: { node: { title: { eq: "${NoCountryForOldMen}" } } },
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
            const JoelCoen = `Joel Coen ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const EthanCoen = `Ethan Coen ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;
            const NoCountryForOldMen = `No Country for Old Men ${generate({
                charset: "alphabetic",
            }).toLowerCase()}`;

            // setup
            await testHelper.executeCypher(`
           CREATE (:${Movie} { title: "${NoCountryForOldMen}", released: 2007 })
           CREATE (:${Person} { name: "${JoelCoen}" })
           CREATE (:${Person} { name: "${EthanCoen}" })
        `);
            const query = /* GraphQL */ `
            mutation  {
                ${Person.operations.update}(
                    where: { name: { contains: "Coen" } }
                    update: {
                        directed: [{
                            connect: { 
                                where: { node: { title: { eq: "${NoCountryForOldMen}" } } },
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
                        name: JoelCoen,
                    },
                    to: {
                        title: NoCountryForOldMen,
                        released: 2007,
                    },
                    relationship: {},
                },
                {
                    from: {
                        name: EthanCoen,
                    },
                    to: {
                        title: NoCountryForOldMen,
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

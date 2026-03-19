/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Entity api on single element relationships to an Interface type", () => {
    let Movie: UniqueType;
    let Person: UniqueType;
    let Dog: UniqueType;
    let AI: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
        Dog = testHelper.createUniqueType("Dog");
        AI = testHelper.createUniqueType("AI");

        const typeDefs = /* GraphQL */ `
            interface Actor {
                name: String!
            }
            interface Director {
                years: Int!
            }

            type ${Movie} @node {
                title: String!
                actor: Actor @relationship(type: "ACTED_IN", direction: IN)
                director: Director @relationship(type: "DIRECTED", direction: IN)
            }

            type ${Dog} implements Actor @node {
                name: String!
            }

            type ${Person} implements Actor & Director @node{
                name: String!
                years: Int!
             }

            type ${AI} implements Director @node {
                model: String!
                years: Int!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("returns first element of 1-1 relationship with multiple relationships", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(:${Person} { name: "Director", years: 10})
            CREATE(m)<-[:DIRECTED]-(:${AI} { model: "T-800", years: 1})
        `);

        const query = `
            query {
               ${Movie.plural} {
                    actor {
                        name
                    }
                    director {
                       years
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    actor: {
                        name: "Hachiko",
                    },
                    director: {
                        years: 10,
                    },
                },
            ],
        });
    });

    test("returns null on 1-1 nullable relationship", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})
        `);

        const query = `
            query {
                ${Movie.plural} {
                      actor {
                       name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    actor: null,
                },
            ],
        });
    });
});

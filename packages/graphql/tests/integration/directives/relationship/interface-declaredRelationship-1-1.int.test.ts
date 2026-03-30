/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Entity api on single element relationships from an Interface type using declared relationship", () => {
    let Movie: UniqueType;
    let Person: UniqueType;
    let Dog: UniqueType;
    let Series: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
        Dog = testHelper.createUniqueType("Dog");
        Series = testHelper.createUniqueType("Series");

        const typeDefs = /* GraphQL */ `
            interface Actor {
                name: String!
            }
            interface Production {
                title: String!
                actor: Actor @declareRelationship
                director: ${Person} @declareRelationship
            }

            type ${Movie} implements Production @node {
                title: String!
                actor: Actor @relationship(type: "ACTED_IN", direction: IN)
                director: ${Person} @relationship(type: "DIRECTED", direction: IN)
            }

            type ${Series} @node {
                name: String!
                actor: Actor @relationship(type: "ACTED_IN", direction: IN)
                director: ${Person} @relationship(type: "DIRECTED", direction: IN)
            }

            type ${Dog} implements Actor @node {
                name: String!
            }

            type ${Person} implements Actor @node{
                name: String!
             }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("returns first element of 1-1 relationship with multiple relationships on top level interface query", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(:${Person} { name: "Director"})
            CREATE(m)<-[:DIRECTED]-(:${Series} { name: "T-800"})
        `);

        const query = `
            query {
              productions {
                    actor {
                        name
                    }
                    director {
                       name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            productions: [
                {
                    actor: {
                        name: "Hachiko",
                    },
                    director: {
                        name: "Director",
                    },
                },
            ],
        });
    });

    test("returns first element of 1-1 relationship with multiple relationships on top level type query", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} { title: "The Matrix"})<-[:ACTED_IN]-(a:${Dog} { name: "Hachiko"})
            CREATE(m)<-[:ACTED_IN]-(:${Person} { name: "Keanu"})
            CREATE(m)<-[:DIRECTED]-(:${Person} { name: "Director"})
            CREATE(m)<-[:DIRECTED]-(:${Series} { name: "T-800"})
        `);

        const query = `
            query {
               ${Movie.plural} {
                    actor {
                        name
                    }
                    director {
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
                    actor: {
                        name: "Hachiko",
                    },
                    director: {
                        name: "Director",
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

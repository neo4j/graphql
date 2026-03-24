/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4615", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Series = testHelper.createUniqueType("Series");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            interface Show {
                title: String!
                release: DateTime!
                actors: [${Actor}!]! @declareRelationship
            }

            type ${Movie} implements Show @node {
                title: String!
                runtime: Int
                release: DateTime!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements Show @node {
                title: String!
                episodes: Int
                release: DateTime!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Actor} @node {
                name: String!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
            `
                // Create Movies
                CREATE (m1:${Movie} { title: "The Movie One", cost: 10000000, runtime: 120, release: dateTime('2007-08-31T16:47+00:00') })
                CREATE (m2:${Movie} { title: "The Movie Two", cost: 20000000, runtime: 90, release: dateTime('2009-08-31T16:47+00:00') })
                CREATE (m3:${Movie} { title: "The Movie Three", cost: 12000000, runtime: 70, release: dateTime('2010-08-31T16:47+00:00') })

                // Create Series
                CREATE (s1:${Series} { title: "The Series One", cost: 10000000, episodes: 10, release: dateTime('2011-08-31T16:47+00:00') })
                CREATE (s2:${Series} { title: "The Series Two", cost: 20000000, episodes: 20, release: dateTime('2012-08-31T16:47+00:00') })
                CREATE (s3:${Series} { title: "The Series Three", cost: 20000000, episodes: 15, release: dateTime('2013-08-31T16:47+00:00') })

                // Create Actors
                CREATE (a1:${Actor} { name: "Actor One" })
                CREATE (a2:${Actor} { name: "Actor Two" })

                // Associate Actor 1 with Movies and Series
                CREATE (a1)-[:ACTED_IN { screenTime: 100 }]->(m1)
                CREATE (a1)-[:ACTED_IN { screenTime: 82 }]->(s1)
                CREATE (a1)-[:ACTED_IN { screenTime: 20 }]->(m3)
                CREATE (a1)-[:ACTED_IN { screenTime: 22 }]->(s3)

                // Associate Actor 2 with Movies and Series
                CREATE (a2)-[:ACTED_IN { screenTime: 240 }]->(m2)
                CREATE (a2)-[:ACTED_IN { screenTime: 728 }]->(s2)
                CREATE (a2)-[:ACTED_IN { screenTime: 728 }]->(m3)
                CREATE (a2)-[:ACTED_IN { screenTime: 88 }]->(s3)
                `
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return null aggregations", async () => {
        const query = /* GraphQL */ `
            query {
                showsConnection(where: { title_STARTS_WITH: "asdasdasd" }) {
                    aggregate {
                        node {
                            title {
                                longest
                            }
                            release {
                                min
                            }
                        }
                    }
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query);
        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            showsConnection: {
                aggregate: {
                    node: {
                        title: {
                            longest: null,
                        },
                        release: {
                            min: null,
                        },
                    },
                },
            },
        });
    });
});

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

import { graphql } from "graphql";
import { type Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import { default as Neo4jHelper } from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4615", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neo4jGraphql: Neo4jGraphQL;

    const Movie = new UniqueType("Movie");
    const Series = new UniqueType("Series");
    const Actor = new UniqueType("Actor");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        const typeDefs = /* GraphQL */ `
            interface Show {
                title: String!
                release: DateTime!
                actors: [${Actor}!]! @declareRelationship
            }

            type ${Movie} implements Show {
                title: String!
                runtime: Int
                release: DateTime!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements Show {
                title: String!
                episodes: Int
                release: DateTime!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Actor} {
                name: String!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;
        neo4jGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        const session = await neo4j.getSession();
        try {
            await session.run(
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
                `,
                {}
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        try {
            await cleanNodesUsingSession(session, [Movie, Series, Actor]);
        } finally {
            await session.close();
        }
        await driver.close();
    });

    test("should return null aggregations", async () => {
        const schema = await neo4jGraphql.getSchema();

        const query = /* GraphQL */ `
            query {
                showsAggregate(where: { title_STARTS_WITH: "asdasdasd" }) {
                    title {
                        longest
                    }
                    release {
                        min
                    }
                }
            }
        `;

        const response = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            showsAggregate: {
                title: {
                    longest: null,
                },
                release: {
                    min: null,
                },
            },
        });
    });
});

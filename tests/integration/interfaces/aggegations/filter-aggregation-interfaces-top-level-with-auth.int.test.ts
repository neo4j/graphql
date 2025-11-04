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

import type { GraphQLError } from "graphql";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { TestHelper } from "../../../utils/tests-helper";

describe("Top-level filter interface query fields with authorization", () => {
    const secret = "the-secret";

    const testHelper = new TestHelper();
    let typeDefs: string;

    const Production = testHelper.createUniqueType("Production");
    const Movie = testHelper.createUniqueType("Movie");
    const Actor = testHelper.createUniqueType("Actor");
    const Series = testHelper.createUniqueType("Series");

    beforeAll(async () => {
        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            interface ${Production} {
                title: String!
                cost: Float!
            }

            type ${Movie} implements ${Production} @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "movies-reader" } } }]) {
                title: String!
                cost: Float!
                runtime: Int!
                ${Actor.plural}: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements ${Production} @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "movies-reader" } } }]) {
                title: String!
                cost: Float!
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type ${Actor} {
                name: String!
                actedIn: [${Production}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        await testHelper.executeCypher(`
            // Create Movies
            CREATE (m1:${Movie} { title: "The Movie One", cost: 10000000, runtime: 120 })
            CREATE (m2:${Movie} { title: "The Movie Two", cost: 20000000, runtime: 90 })
            CREATE (m3:${Movie} { title: "The Movie Three", cost: 12000000, runtime: 70 })
            
            // Create Series
            CREATE (s1:${Series} { title: "The Series One", cost: 10000000, episodes: 10 })
            CREATE (s2:${Series} { title: "The Series Two", cost: 20000000, episodes: 20 })
            CREATE (s3:${Series} { title: "The Series Three", cost: 20000000, episodes: 15 })
            
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
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: { key: secret },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("aggregation with auth should succeed", async () => {
        const query = /* GraphQL */ `
            query {
                ${Production.operations.aggregate} (where: { title_STARTS_WITH: "The" }) {
                    title {
                        longest
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { roles: ["movies-reader", "series-reader"] });
        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect((queryResult as any).data[Production.operations.aggregate]["title"]["longest"]).toBe("The Series Three");
    });

    test("aggregation with auth should fail", async () => {
        const query = /* GraphQL */ `
            query {
                ${Production.operations.aggregate} (where: { title_STARTS_WITH: "The" }) {
                    title {
                        longest
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { roles: [] });
        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeDefined();
        expect((queryResult.errors as GraphQLError[]).some((el) => el.message.includes("Forbidden"))).toBeTruthy();
        expect(queryResult.data).toBeNull();
    });
});

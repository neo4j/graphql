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

import { createBearerToken } from "../../../../utils/create-bearer-token";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("Field Level Aggregations Field Authorization", () => {
    const secret = "the-secret";

    const testHelper = new TestHelper();

    let Series: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        Series = testHelper.createUniqueType("Series");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Series} {
                title: String! @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "series_title_aggregator" } } }])
                cost: Float!
                episodes: Int!
            }
            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
            type ${Actor} {
                name: String!
                actedIn: [${Series}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
            type JWT @jwt {
                roles: [String!]!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: { key: secret },
            },
        });

        await testHelper.executeCypher(`
            CREATE (a:${Actor} {name: "Keanu"})-[:ACTED_ON  {screenTime: 10}]->(:${Series} {title: "Doctor Who", cost: 10.0, episodes: 5000})
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("fail title validation", async () => {
        const query = `
            query {
                ${Series.operations.aggregate} {
                    title {
                        longest
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { roles: ["movies-reader", "series-reader", "series-title-reader"] });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("fail title validation in nested query", async () => {
        const query = `
            query {
                ${Actor.plural} {
                    actedInAggregate {
                        node {
                            title {
                                longest
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { roles: ["movies-reader", "series-reader", "series-title-reader"] });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });
});

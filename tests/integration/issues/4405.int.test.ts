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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4405", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie.name} {
                title: String
            }

            type ${Actor.name}
                @authorization(
                    validate: [
                        {
                            when: [BEFORE]
                            operations: [READ]
                            where: { node: { actedInConnection_SOME: { node: { title_IN: ["Matrix", "John Wick"] } } } }
                        }
                    ]
                ) {
                name: String!
                actedIn: [${Movie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        await testHelper.executeCypher(
            `
                CREATE (m:${Movie.name} {title: "Matrix" })<-[:ACTED_IN]-(a:${Actor.name} { name: "Keanu"})
                CREATE (a)-[:ACTED_IN]->(:${Movie.name} {title: "John Wick" })
                CREATE (m2:${Movie.name} {title: "Hunger games" })<-[:ACTED_IN]-(a2:${Actor.name} { name: "Laurence"})

                `
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should not raise if title is the filter array value", async () => {
        const query = /* GraphQL */ `
            query Actors {
                ${Actor.plural}(where: { name: "Keanu"}) {
                    name
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            contextValue: { jwt: { uid: "user-1" } },
        });
        expect(response.errors).toBeFalsy();
        expect(response.data?.[Actor.plural]).toStrictEqual(
            expect.arrayContaining([
                {
                    name: "Keanu",
                },
            ])
        );
    });

    test("should raise if title is not in the filter array value", async () => {
        const query = /* GraphQL */ `
            query Actors {
                ${Actor.plural}(where: { name: "Laurence"}) {
                    name
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            contextValue: { jwt: { uid: "user-1" } },
        });
        expect(response.errors?.[0]?.message).toContain("Forbidden");
    });
});

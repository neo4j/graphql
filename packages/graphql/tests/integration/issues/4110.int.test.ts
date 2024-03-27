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

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4110", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let Company: UniqueType;
    let InBetween: UniqueType;

    beforeAll(() => {});

    beforeEach(async () => {
        Company = testHelper.createUniqueType("User");
        InBetween = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Company}
                @authorization(
                    filter: [{ operations: [READ], where: { node: { inBetween: { company: { id: "example" } } } } }]
                ) {
                id: ID @id
                inBetween: ${InBetween} @relationship(type: "CONNECT_TO", direction: OUT)
            }
            type ${InBetween} {
                id: ID @id
                company: ${Company}! @relationship(type: "CONNECT_TO", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    beforeEach(async () => {
        await testHelper.executeCypher(`
            CREATE (c1:${Company} { id: "example" })
            CREATE (c2:${Company} { id: "another" })

            CREATE (ib1:${InBetween} {id: "id1"})
            CREATE (ib2:${InBetween} {id: "id2"})

            CREATE(ib1)<-[:CONNECT_TO]-(c1)
            CREATE(ib2)<-[:CONNECT_TO]-(c2)
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("filters companies on nested auth where", async () => {
        const query = /* GraphQL */ `
            query {
                ${Company.plural} {
                    id
                    inBetween {
                        company {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret);

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeUndefined();
        expect((result.data as any)[Company.plural]).toEqual([
            {
                id: "example",
                inBetween: {
                    company: {
                        id: "example",
                    },
                },
            },
        ]);
    });
});

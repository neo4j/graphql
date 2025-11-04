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

describe("https://github.com/neo4j/graphql/issues/4239", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = `
                type ${Movie.name}
                @authorization(
                    validate: [
                        { when: [BEFORE], where: { node: { directorConnection: { node: { id: "$jwt.sub" } } } } }
                    ]
                ) {
                title: String
                director: [${Person.name}!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type ${Person.name} {
                id: ID
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
            `CREATE (m:${Movie.name} {title: "Matrix"})<-[:DIRECTED]-(p:${Person.name} {id: "SOME_ID"})`
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return Matrix if the JWT.sub matches", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            contextValue: { jwt: { sub: "SOME_ID" } },
        });
        expect(response.errors).toBeFalsy();
        expect(response.data?.[Movie.plural]).toStrictEqual(
            expect.arrayContaining([expect.objectContaining({ title: "Matrix" })])
        );
    });

    test("should return a Forbidden error if the JWT.sub do not matches", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            contextValue: { jwt: { sub: "SOME_WRONG_ID" } },
        });
        expect((response.errors as any[])[0].message).toBe("Forbidden");
    });
});

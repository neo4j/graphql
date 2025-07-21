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

describe("https://github.com/neo4j/graphql/issues/6491", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let SVG: UniqueType;
    let VectorGraphic: UniqueType;

    beforeAll(async () => {
        SVG = testHelper.createUniqueType("SVG");
        VectorGraphic = testHelper.createUniqueType("VectorGraphic");

        typeDefs = /* GraphQL */ `
            interface VectorGraphic {
                cypherTest: Boolean
                name: String!
            }

            type SVG implements VectorGraphic
                @mutation(operations: [UPDATE, DELETE, CREATE])
                @node(labels: ["${SVG}", "${VectorGraphic}"])
                @subscription(events: []) {
                cypherTest: Boolean
                    @cypher(
                        statement: """
                        RETURN this['name'] = 'test' AS result
                        """
                        columnName: "result"
                    )
                name: String!
            }
        `;

        await testHelper.executeCypher(`
            CREATE(:${SVG}:${VectorGraphic} { name: "test" })
            CREATE(:${SVG}:${VectorGraphic} { name: "Another" })
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("filter over a cypher field on an interface", async () => {
        const query = /* GraphQL */ `
            query {
                vectorGraphics(where: { cypherTest: { eq: true } }) {
                    cypherTest
                    name
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            vectorGraphics: [
                {
                    cypherTest: true,
                    name: "test",
                },
            ],
        });
    });

    test("filter over a cypher field on an concrete entity", async () => {
        const query = /* GraphQL */ `
            query {
                vectorGraphics(where: { cypherTest: { eq: true } }) {
                    cypherTest
                    name
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            vectorGraphics: [
                {
                    cypherTest: true,
                    name: "test",
                },
            ],
        });
    });
});

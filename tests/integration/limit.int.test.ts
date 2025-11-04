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

import { TestHelper } from "../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1628", () => {
    const testHelper = new TestHelper();
    const workType = testHelper.createUniqueType("Work");
    const titleType = testHelper.createUniqueType("Title");

    beforeAll(async () => {
        const typeDefs = `
            type ${workType} @node(labels: ["${workType}", "Resource"]) @mutation(operations: []) {
                """
                IRI
                """
                iri: ID! @unique @alias(property: "uri")
                title: [${titleType}!]! @relationship(type: "title", direction: OUT)
            }

            type ${titleType} @node(labels: ["${titleType}", "property"]) @mutation(operations: []) {
                value: String
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Nested filter with limit cypher should be composed correctly", async () => {
        const query = `
            {
                ${workType.plural}(options: { limit: 1 }, where: { title: { value_CONTAINS: "0777" } }) {
                    title(where: { value_CONTAINS: "0777" }) {
                        value
                    }
                }
            }
        `;

        await testHelper.executeCypher(`
            CREATE (t:${workType}:Resource)-[:title]->(:${titleType}:property {value: "bond0777"})
            CREATE (t)-[:title]->(:${titleType}:property {value: "bond0777"})
        `);

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [workType.plural]: [
                {
                    title: [
                        {
                            value: "bond0777",
                        },
                        {
                            value: "bond0777",
                        },
                    ],
                },
            ],
        });
    });
});

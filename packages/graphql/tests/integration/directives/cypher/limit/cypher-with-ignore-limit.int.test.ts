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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("Cypher directive with limit ignoreGeneratedLimit flag", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let Tag: UniqueType;
    let TagGroup: UniqueType;

    beforeEach(async () => {
        Tag = testHelper.createUniqueType("Tag");
        TagGroup = testHelper.createUniqueType("TagGroup");

        typeDefs = /* GraphQL */ `
            type ${Tag} @limit(default: 2, max: 100) @node {
                name: String!
            }

            type ${TagGroup} @node {
                id: ID
                tags(tagNames: [String]!, limit: Int): [${Tag}]
                    @cypher(
                        statement: """
                        MATCH (t:${Tag})
                        WHERE ANY(name IN $tagNames WHERE t.displayName = toLower(name))
                        RETURN t
                        LIMIT $limit
                        """
                        columnName: "t"
                    )
            }

            type Query {
                getTagsByNames(tagNames: [String]!, limit: Int): [${Tag}]
                    @cypher(
                        statement: """
                        MATCH (t:${Tag})
                        WHERE ANY(name IN $tagNames
                            WHERE t.displayName = toLower(name))
                        RETURN t
                        LIMIT $limit
                        """
                        columnName: "t"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                cypherDirective: {
                    ignoreGeneratedLimit: true,
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Top level cypher with limit param does not apply default limit", async () => {
        const query = /* GraphQL */ `
            query {
                getTagsByNames(tagNames: ["a", "b", "c"], limit: 50) {
                    name
                }
            }
        `;

        await testHelper.executeCypher(`
            CREATE(:${Tag} {name: "a", displayName: "a"})
            CREATE(:${Tag} {name: "a", displayName: "a"})
            CREATE(:${Tag} {name: "a", displayName: "a"})
            `);

        const queryResult = await testHelper.executeGraphQL(query);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            getTagsByNames: [
                {
                    name: "a",
                },
                { name: "a" },
                { name: "a" },
            ],
        });
    });

    test("Nested cypher with limit param does not apply default limit", async () => {
        const query = /* GraphQL */ `
            query {
                ${TagGroup.plural} {
                    id
                    tags(tagNames: ["a"], limit: 14) {
                        name
                    }
                }
            }
        `;

        await testHelper.executeCypher(`
            CREATE(:${Tag} {name: "a", displayName: "a"})
            CREATE(:${Tag} {name: "a", displayName: "a"})
            CREATE(:${Tag} {name: "a", displayName: "a"})
            CREATE(:${TagGroup} {id: "1"})

            `);

        const queryResult = await testHelper.executeGraphQL(query);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [TagGroup.plural]: [
                {
                    id: "1",
                    tags: [
                        {
                            name: "a",
                        },
                        { name: "a" },
                        { name: "a" },
                    ],
                },
            ],
        });
    });
});

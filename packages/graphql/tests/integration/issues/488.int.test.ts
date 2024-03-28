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

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/488", () => {
    const testHelper = new TestHelper();

    beforeAll(() => {});

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return correct data based on issue", async () => {
        const testJournalist = testHelper.createUniqueType("Journalist");
        const testEmoji = testHelper.createUniqueType("Emoji");
        const testHashtag = testHelper.createUniqueType("Hashtag");
        const testText = testHelper.createUniqueType("Text");

        const typeDefs = gql`
            type ${testJournalist.name} {
                id: ID!
                keywords: [Keyword!]! @relationship(type: "HAS_KEYWORD", direction: OUT)
            }

            union Keyword = ${testEmoji.name} | ${testHashtag.name} | ${testText.name}

            type ${testEmoji.name} {
                id: ID! @id @unique
                type: String!
            }

            type ${testHashtag.name} {
                id: ID! @id @unique
                type: String!
            }

            type ${testText.name} {
                id: ID! @id @unique
                type: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const journalistId = generate({
            charset: "alphabetic",
        });

        const emojiId = generate({
            charset: "alphabetic",
        });

        const emojiType = "Smile";

        const query = `
            query Query($journalistsWhere: ${testJournalist.name}Where) {
                ${testJournalist.plural}(where: $journalistsWhere) {
                  id
                  keywords {
                    ... on ${testEmoji.name} {
                      id
                      type
                    }
                  }
                }
            }
        `;

        const variableValues = {
            journalistsWhere: {
                id: journalistId,
                keywordsConnection: {
                    [testEmoji.name]: {
                        node: {
                            type: emojiType,
                        },
                    },
                },
            },
        };

        await testHelper.executeCypher(`
                CREATE (j:${testJournalist.name} { id: "${journalistId}" })-[:HAS_KEYWORD]->(:${testEmoji.name} { id: "${emojiId}", type: "${emojiType}" })
            `);

        const result = await testHelper.executeGraphQL(query, {
            variableValues,
        });

        if (result.errors) {
            console.log(JSON.stringify(result.errors, null, 2));
        }

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            [testJournalist.plural]: [
                {
                    id: journalistId,
                    keywords: [
                        {
                            id: emojiId,
                            type: emojiType,
                        },
                    ],
                },
            ],
        });
    });
});

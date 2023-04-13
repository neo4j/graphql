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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/488", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return correct data based on issue", async () => {
        const session = await neo4j.getSession();

        const testJournalist = new UniqueType("Journalist");
        const testEmoji = new UniqueType("Emoji");
        const testHashtag = new UniqueType("Hashtag");
        const testText = new UniqueType("Text");

        const typeDefs = gql`
            type ${testJournalist.name} {
                id: ID!
                keywords: [Keyword!]! @relationship(type: "HAS_KEYWORD", direction: OUT)
            }

            union Keyword = ${testEmoji.name} | ${testHashtag.name} | ${testText.name}

            type ${testEmoji.name} {
                id: ID! @id
                type: String!
            }

            type ${testHashtag.name} {
                id: ID! @id
                type: String!
            }

            type ${testText.name} {
                id: ID! @id
                type: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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

        try {
            await session.run(`
                CREATE (j:${testJournalist.name} { id: "${journalistId}" })-[:HAS_KEYWORD]->(:${testEmoji.name} { id: "${emojiId}", type: "${emojiType}" })
            `);

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
        } finally {
            await session.close();
        }
    });
});

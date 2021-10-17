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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/488", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return correct data based on issue", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Journalist {
                id: ID!
                keywords: [Keyword]! @relationship(type: "HAS_KEYWORD", direction: OUT)
            }

            union Keyword = Emoji | Hashtag | Text

            type Emoji {
                id: ID! @id
                type: String!
            }

            type Hashtag {
                id: ID! @id
                type: String!
            }

            type Text {
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
            query Query($journalistsWhere: JournalistWhere) {
                journalists(where: $journalistsWhere) {
                  id
                  keywords {
                    ... on Emoji {
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
                    Emoji: {
                        node: {
                            type: emojiType,
                        },
                    },
                },
            },
        };

        try {
            await session.run(`
                CREATE (j:Journalist { id: "${journalistId}" })-[:HAS_KEYWORD]->(:Emoji { id: "${emojiId}", type: "${emojiType}" })
            `);

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
                variableValues,
            });

            if (result.errors) {
                console.log(JSON.stringify(result.errors, null, 2));
            }

            expect(result.errors).toBeFalsy();

            expect(result.data as any).toEqual({
                journalists: [
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

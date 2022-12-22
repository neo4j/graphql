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

import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";

describe("579", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should be able to get fields in union of common interface", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
          interface HasId {
            id: ID!
          }

          type Outer {
            related: [Related!]! @relationship(type: "OUTER", direction: OUT)
          }

          type Type1 implements HasId {
            id: ID! @id
            text: String!
          }
          type Type2 implements HasId {
            id: ID! @id
            otherText: String!
          }

          union Types = Type1 | Type2

          type Related implements HasId {
            id: ID! @id

            related: Types! @relationship(type: "RELATED", direction: OUT)
          }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const type1Id = generate({
            charset: "alphabetic",
        });
        const relatedId = generate({
            charset: "alphabetic",
        });

        const query = `
          query {
            outers {
            related {
              id
              related {
                ... on HasId {
                  __isHasId: __typename
                  id
                }
              }
            }
            }
          }
        `;

        try {
            await session.run(
                `
                    CREATE (outer:Outer)
                    CREATE (type1:Type1 { id: $type1Id, text: "test" })
                    CREATE (related:Related { id: $relatedId })
                    MERGE (outer)-[:OUTER]->(related)
                    MERGE (related)-[:RELATED]->(type1)
            `,
                {
                    type1Id,
                    relatedId,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            console.dir(gqlResult, { depth: 10 });
        } finally {
            await session.close();
        }
    });
});

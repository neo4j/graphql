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
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/526 - Int Argument on Custom Query Converted to Float", () => {
    let driver: Driver;
    let bookmarks: string[];
    const typeDefs = gql`
        type Movie {
            title: String
            tags: [Tag] @relationship(type: "HAS", direction: OUT)
        }

        type Tag {
            name: String!
            papers: [Movie] @relationship(type: "HAS", direction: IN)
        }

        type Query {
            movie_tags(tagName: String = "", limit: Int): [Movie]
                @cypher(
                    statement: """
                    MATCH (tag:Tag)<-[:HAS]-(movie:Movie)
                    WHERE tag.name = $tagName
                    RETURN movie
                    LIMIT $limit
                    """
                )
        }
    `;

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();

        try {
            await session.run(
                `
                    CREATE (m1:Movie {title: "M1"}), (m2:Movie {title: "M2"}), (t1:Tag {name: "T1"}), (t2:Tag {name: "T2"})
                    CREATE (m1)-[:HAS]->(t1)<-[:HAS]-(m2)
                    CREATE (m1)-[:HAS]->(t2)
                `
            );
            bookmarks = session.lastBookmark();
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = driver.session();

        try {
            await session.run(`MATCH (m:Movie) WHERE m.title IN ["M1", "M2"] DETACH DELETE m`);
            await session.run(`MATCH (t:Tag) WHERE t.name IN ["T1", "T2"] DETACH DELETE t`);
        } finally {
            await session.close();
        }

        await driver.close();
    });

    test("Query with a limit", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
        {
            movie_tags(tagName: "T1", limit: 25) {
              title
              tags {
                name
              }
            }
          }
        `;

        await neoSchema.checkNeo4jCompat();

        const result = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks } },
        });

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            movie_tags: expect.arrayContaining([
                expect.objectContaining({
                    title: "M1",
                    tags: expect.arrayContaining([{ name: "T1" }, { name: "T2" }]),
                }),
                expect.objectContaining({
                    title: "M2",
                    tags: [{ name: "T1" }],
                }),
            ]),
        });
        await session.close();
    });
});

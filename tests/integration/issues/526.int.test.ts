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

describe("https://github.com/neo4j/graphql/issues/526 - Int Argument on Custom Query Converted to Float", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Tag: UniqueType;
    let typeDefs: string;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Tag = testHelper.createUniqueType("Tag");

        typeDefs = `
        type ${Movie} {
            title: String
            tags: [${Tag}!]! @relationship(type: "HAS", direction: OUT)
        }

        type ${Tag} {
            name: String!
            papers: [${Movie}!]! @relationship(type: "HAS", direction: IN)
        }

        type Query {
            movie_tags(tagName: String = "", limit: Int): [${Movie}]
                @cypher(
                    statement: """
                    MATCH (tag:${Tag})<-[:HAS]-(movie:${Movie})
                    WHERE tag.name = $tagName
                    RETURN movie
                    LIMIT $limit
                    """
                    columnName: "movie"
                )
        }
    `;

        await testHelper.executeCypher(
            `
                    CREATE (m1:${Movie} {title: "M1"}), (m2:${Movie} {title: "M2"}), (t1:${Tag} {name: "T1"}), (t2:${Tag} {name: "T2"})
                    CREATE (m1)-[:HAS]->(t1)<-[:HAS]-(m2)
                    CREATE (m1)-[:HAS]->(t2)
                `
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Query with a limit", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

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

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            movie_tags: expect.toIncludeSameMembers([
                expect.objectContaining({
                    title: "M1",
                    tags: expect.toIncludeSameMembers([{ name: "T1" }, { name: "T2" }]),
                }),
                expect.objectContaining({
                    title: "M2",
                    tags: [{ name: "T1" }],
                }),
            ]),
        });
    });
});

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

describe("https://github.com/neo4j/graphql/issues/1848", () => {
    const testHelper = new TestHelper();

    let ContentPiece: UniqueType;
    let Project: UniqueType;
    let Community: UniqueType;

    beforeAll(async () => {
        ContentPiece = testHelper.createUniqueType("ContentPiece");
        Project = testHelper.createUniqueType("Project");
        Community = testHelper.createUniqueType("Community");
        const typeDefs = `
        type ${ContentPiece} @node(labels: ["${ContentPiece}", "UNIVERSAL"]) {
            uid: String! @unique
            id: Int
        }

        type ${Project} @node(labels: ["${Project}", "UNIVERSAL"]) {
            uid: String! @unique
            id: Int
        }

        type ${Community} @node(labels: ["${Community}", "UNIVERSAL"]) {
            uid: String! @unique
            id: Int
            hasContentPieces: [${ContentPiece}!]!
                @relationship(type: "COMMUNITY_CONTENTPIECE_HASCONTENTPIECES", direction: OUT)
            hasAssociatedProjects: [${Project}!]!
                @relationship(type: "COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS", direction: OUT)
        }

        extend type ${Community} {
            """
            Used on Community Landing Page
            """
            hasFeedItems(limit: Int = 10, pageIndex: Int = 0): [FeedItem!]!
                @cypher(
                    statement: """
                    Match(this)-[:COMMUNITY_CONTENTPIECE_HASCONTENTPIECES|:COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS]-(pag) return pag SKIP ($limit * $pageIndex) LIMIT $limit
                    """,
                    columnName: "pag"
                )
        }

        union FeedItem = ${ContentPiece} | ${Project}
    `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should resolve union in cypher directive correctly", async () => {
        const query = `
            query {
                ${Community.plural} {
                    id
                    hasFeedItems {
                        ... on ${ContentPiece} {
                            id
                        }
                        ... on ${Project} {
                            id
                        }
                    }
                }
            }
        `;

        const res = await testHelper.executeGraphQL(query);

        expect(res.errors).toBeUndefined();

        expect(res.data).toEqual({
            [Community.plural]: [],
        });
    });
});

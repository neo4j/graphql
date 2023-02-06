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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/1848", () => {
    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;

    const typeDefs = `
        type ContentPiece @node(labels: ["ContentPiece", "UNIVERSAL"]) {
            uid: String! @unique
            id: Int
        }

        type Project @node(labels: ["Project", "UNIVERSAL"]) {
            uid: String! @unique
            id: Int
        }

        type Community @node(labels: ["Community", "UNIVERSAL"]) {
            uid: String! @unique
            id: Int
            hasContentPieces: [ContentPiece!]!
                @relationship(type: "COMMUNITY_CONTENTPIECE_HASCONTENTPIECES", direction: OUT)
            hasAssociatedProjects: [Project!]!
                @relationship(type: "COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS", direction: OUT)
        }

        extend type Community {
            """
            Used on Community Landing Page
            """
            hasFeedItems(limit: Int = 10, pageIndex: Int = 0): [FeedItem!]!
                @cypher(
                    statement: """
                    Match(this)-[:COMMUNITY_CONTENTPIECE_HASCONTENTPIECES|:COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS]-(pag) return pag SKIP ($limit * $pageIndex) LIMIT $limit
                    """
                )
        }

        union FeedItem = ContentPiece | Project
    `;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should resolve union in cypher directive correctly", async () => {
        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        schema = await neoGraphql.getSchema();

        const query = `
            query {
                communities {
                    id
                    hasFeedItems {
                        ... on ContentPiece {
                            id
                        }
                        ... on Project {
                            id
                        }
                    }
                }
            }
        `;

        const res = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(res.errors).toBeUndefined();

        expect(res.data).toEqual({
            communities: [],
        });
    });
});

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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2652", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let locationType: UniqueType;
    let reviewType: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        locationType = new UniqueType("Location");
        reviewType = new UniqueType("Review");

        const typeDefs = `
            type Location @auth(rules: [{ isAuthenticated: true }]) {
                id: ID!
                reviews: [LocationReview!]! @relationship(type: "HAS_REVIEW", direction: OUT)
            }

            type LocationReview @auth(rules: [{ isAuthenticated: true }]) {
                id: ID!
                rating: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [locationType, reviewType]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Does not throw error when count and node aggregations in selection set", async () => {
        const query = `
            query ReviewsAggregate {
                locations {
                    reviewsAggregate {
                        count
                        node {
                            rating {
                                average
                            }
                        }
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
    });
});

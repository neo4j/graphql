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

describe("https://github.com/neo4j/graphql/issues/3394", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    const Product = new UniqueType("Product");

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });
    afterAll(async () => {
        await driver.close();
    });

    test("should sort elements by aliased field", async () => {
        const typeDefs = `#graphql
            type ${Product} {
                id: String! @alias(property: "fg_item_id")
                description: String!
                partNumber: ID! @alias(property: "fg_item")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = `#graphql
            query listProducts {
                ${Product.plural}(options: { sort: { partNumber: DESC } }) {
                    id
                    partNumber
                    description
                }
            }
        `;

        await session.run(
            `
                CREATE (:${Product} {fg_item_id: "p1", description: "a p1", fg_item: "part1"})
                CREATE (:${Product} {fg_item_id: "p2", description: "a p2", fg_item: "part2"})
            `
        );

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data?.[Product.plural]).toEqual([
            {
                id: "p2",
                description: "a p2",
                partNumber: "part2",
            },
            {
                id: "p1",
                description: "a p1",
                partNumber: "part1",
            },
        ]);
    });
});

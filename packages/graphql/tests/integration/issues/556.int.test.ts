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
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/556 - Input Object type ArticleCreateInput must define one or more fields", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let bookmarks: string[];
    const typeDefs = gql`
        type User556 {
            name: String!
            things: [Thing556!]! @relationship(type: "HAS_THINGS", direction: OUT)
        }

        type Thing556 {
            id: ID! @id
        }
    `;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        const session = await neo4j.getSession();

        try {
            await session.run(`MATCH (u:User556) DETACH DELETE u`);
            await session.run(`MATCH (t:Thing556) DETACH DELETE t`);
        } finally {
            await session.close();
        }

        await driver.close();
    });

    test("Can create empty nodes", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            mutation {
                createUser556s(input: { name: "Darrell", things: { create: [{ node: {} }, { node: {} }] } }) {
                    user556s {
                        name
                        things {
                            id
                        }
                    }
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
        });

        expect(result.errors).toBeFalsy();

        expect((result.data as any)?.createUser556s.user556s).toHaveLength(1);
        expect((result.data as any)?.createUser556s.user556s[0].name).toBe("Darrell");
        expect((result.data as any)?.createUser556s.user556s[0].things).toHaveLength(2);
        await session.close();
    });
});

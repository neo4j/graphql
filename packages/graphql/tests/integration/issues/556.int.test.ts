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
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/556 - Input Object type ArticleCreateInput must define one or more fields", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let typeDefs: string;
    let User: UniqueType;
    let Thing: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        User = new UniqueType("User");
        Thing = new UniqueType("Thing");

        typeDefs = `
            type ${User} {
                name: String!
                things: [${Thing}!]! @relationship(type: "HAS_THINGS", direction: OUT)
            }

            type ${Thing} {
                id: ID! @id @unique
            }
        `;
    });

    afterAll(async () => {
        const session = await neo4j.getSession();

        try {
            await session.run(`MATCH (u:${User}) DETACH DELETE u`);
            await session.run(`MATCH (t:${Thing}) DETACH DELETE t`);
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
                ${User.operations.create}(input: { name: "Darrell", things: { create: [{ node: {} }, { node: {} }] } }) {
                    ${User.plural} {
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
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();

        expect((result.data as any)[User.operations.create][User.plural]).toHaveLength(1);
        expect((result.data as any)[User.operations.create][User.plural][0].name).toBe("Darrell");
        expect((result.data as any)[User.operations.create][User.plural][0].things).toHaveLength(2);
        await session.close();
    });
});

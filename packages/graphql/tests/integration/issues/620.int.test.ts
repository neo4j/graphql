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

import { gql } from "graphql-tag";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/620", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    const typeUser = new UniqueType("User");
    const typeBusiness = new UniqueType("Business");

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = gql`
            type ${typeUser.name} {
                id: String
                name: String
            }
            type ${typeBusiness.name} {
                id: String
                name: String
            }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
        session = await neo4j.getSession();
        await session.run(`
              CREATE (u:${typeUser.name} {id: "1234", name: "arthur"})
              CREATE (b:${typeBusiness.name} {id: "1234", name: "ford"})
            `);
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    test("should return topic count", async () => {
        const query = `
            query {
                ${typeUser.plural}(where: { id: "1234"}) {
                    id
                    name
                }
                ${typeBusiness.plural}(where: { id: "1234" }) {
                    id
                    name
                }
            }
        `;

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [typeBusiness.plural]: [
                {
                    id: "1234",
                    name: "ford",
                },
            ],
            [typeUser.plural]: [
                {
                    id: "1234",
                    name: "arthur",
                },
            ],
        });
    });
});

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

import { gql } from "apollo-server";
import { graphql } from "graphql";
import { Driver, Session } from "neo4j-driver";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/620", () => {
    let driver: Driver;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    const typeUser = generateUniqueType("User");
    const typeBusiness = generateUniqueType("Business");

    beforeAll(async () => {
        driver = await neo4j();

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
        try {
            session = driver.session();
            await session.run(`
              CREATE (u:${typeUser.name} {id: "1234", name: "arthur"})
              CREATE (b:${typeBusiness.name} {id: "1234", name: "ford"})
            `);
        } finally {
            await session.close();
        }
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
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
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
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

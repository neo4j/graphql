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
import { getQuerySource } from "../../utils/get-query-source";

describe("https://github.com/neo4j/graphql/issues/619", () => {
    let driver: Driver;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = gql`
            type FooIsARandomName {
                id: ID @unique
                Name: String
                Age: Int
                DrinksAt: BarIsACoolName @relationship(type: "DRINKS_AT", direction: OUT)
            }

            type BarIsACoolName {
                id: ID @unique
                Adress: String
                Customers: [FooIsARandomName!]! @relationship(type: "DRINKS_AT", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
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

    test("should not throw 'input.map is not a function' error on one to many mutations", async () => {
        const mutation = gql`
            mutation {
                createFooIsARandomNames(
                    input: {
                        DrinksAt: {
                            connectOrCreate: {
                                where: { node: { id: "b50bd49b-9295-4749-9c0e-91d1e16df0b5" } }
                                onCreate: { node: { Adress: "Some Street" } }
                            }
                        }
                    }
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: getQuerySource(mutation),
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });

        expect(gqlResult.errors).toBeUndefined();
    });
});

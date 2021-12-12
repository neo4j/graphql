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
import { Driver, int } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../src";
import neo4j from "./neo4j";

describe("mutation events (create > connect)", () => {
    let driver: Driver;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();

        const typeDefs = gql`
            type Actor {
                name: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {
                addInternalIdsToSchema: true,
            },
        });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Filters by internal ID", async () => {
        const session = driver.session();

        const actorName1 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const actorName2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const query = `
            query actors($id: Int!) {
                actors(where: { _id: $id }) {
                    name
                }
            }
        `;

        try {
            const { records: [ record ] } = await session.run(
                `
                CREATE (a1:Actor { name: $actorName1 })
                CREATE (a2:Actor { name: $actorName2 })
                RETURN id(a1) as a1, id(a2) as a2
            `,
                { actorName1, actorName2 }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    id: int(record.get('a1')).toNumber(),
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                actors: [
                    {
                        name: actorName1,
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("Returns internal ID", async () => {
        const session = driver.session();

        const actorName1 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const actorName2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const query = `
            query actors($names: [ String! ]!) {
                actors( where: { name_IN: $names } ) {
                    _id
                    name
                }
            }
        `;

        try {
            const { records: [ record ] } = await session.run(
                `
                CREATE (a1:Actor { name: $actorName1 })
                CREATE (a2:Actor { name: $actorName2 })
                RETURN id(a1) as a1, id(a2) as a2
            `,
                { actorName1, actorName2 }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    names: [ actorName1, actorName2 ],
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                actors: [
                    {
                        name: actorName1,
                        _id: int(record.get('a1')).toNumber(),
                    },
                    {
                        name: actorName2,
                        _id: int(record.get('a2')).toNumber(),
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    it('Does not add internal ids if option is not provided', async () => {

        const session = driver.session();

        const typeDefs = gql`
            type Actor {
                name: String!
            }
        `;

        const newNeoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {
                // addInternalIdsToSchema: true,
            },
        });

        try {
            const gqlResult1 = await graphql({
                schema: newNeoSchema.schema,
                source: `
                    query actors($id: Int!) {
                        actors(where: { _id: $id }) {
                            name
                        }
                    }
                `,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    id: 1,
                },
            });

            expect(gqlResult1.errors).toMatchObject([{
                message: 'Field "_id" is not defined by type "ActorWhere". Did you mean "AND"?',
            }]);

            const gqlResult2 = await graphql({
                schema: newNeoSchema.schema,
                source: `
                    query actors {
                        actors {
                            _id
                            name
                        }
                    }
                `,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {},
            });


            expect(gqlResult2.errors).toMatchObject([{
                message: 'Cannot query field "_id" on type "Actor".',
            }]);
            // expect(gqlResult2.errors).toBeFalsy();
            // expect(gqlResult2.data).toBeFalsy();
        } finally {
            await session.close();
        }
    });
});

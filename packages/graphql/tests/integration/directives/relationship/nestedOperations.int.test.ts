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
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";

describe("@relationhip - nestedOperations", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    let Movie: UniqueType;
    let Person: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
        Movie = new UniqueType("Movie");
        Person = new UniqueType("Person");
    });

    afterEach(async () => {
        await session.close();
    });
    afterAll(async () => {
        await driver.close();
    });

    describe("Related to a concrete type", () => {
        let createMutationWithNestedCreate: string;
        let createMutationWithNestedConnect: string;
        let createMutationWithNestedConnectOrCreate: string;
        let updateMutationWithNestedCreate: string;
        let updateMutationWithNestedConnect: string;
        let updateMutationWithNestedConnectOrCreate: string;
        let updateMutationWithNestedDisconnect: string;
        let updateMutationWithNestedUpdate: string;
        let updateMutationWithNestedDelete: string;
        let deleteMutationWithNestedDelete: string;

        beforeEach(() => {
            createMutationWithNestedCreate = `#graphql
                mutation {
                    ${Movie.operations.create}(input: { id: "1", actors: { create: { node: { name: "someName" } } } }) {
                        info {
                            nodesCreated
                        }
                    }
                }
            `;
            createMutationWithNestedConnect = `#graphql
                mutation {
                    ${Movie.operations.create}(input: { id: "1", actors: { connect: { where: { node: { name: "someName" } } } } }) {
                        info {
                            nodesCreated
                        }
                    }
                }
            `;
            createMutationWithNestedConnectOrCreate = `#graphql
                mutation {
                    ${Movie.operations.create}(
                        input: {
                            id: "1"
                            actors: {
                                connectOrCreate: {
                                    where: { node: { id: "1" } }
                                    onCreate: { node: { name: "someName" } }
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
            updateMutationWithNestedCreate = `#graphql
                mutation {
                    ${Movie.operations.update}(update: { actors: { create: { node: { name: "someName" } } } }) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedConnect = `#graphql
                mutation {
                    ${Movie.operations.update}(
                        update: { actors: { connect: { where: { node: { name: "someName" } } } } }
                    ) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedConnectOrCreate = `#graphql
                mutation {
                    ${Movie.operations.update}(
                        update: {
                            actors: {
                                connectOrCreate: {
                                    where: { node: { id: "1" } }
                                    onCreate: { node: { name: "someName" } }
                                }
                            }
                        }
                    ) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedDisconnect = `#graphql
                mutation {
                    ${Movie.operations.update}(
                        update: {
                            actors: { disconnect: { where: { node: { name: "someName" } } } }
                        }
                    ) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedUpdate = `#graphql
                mutation {
                    ${Movie.operations.update}(update: { actors: { update: { node: { name: "someName" } } } }) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedDelete = `#graphql
                mutation {
                    ${Movie.operations.update}(update: { actors: { delete: { where: { node: { name: "someName" } } } } }) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            deleteMutationWithNestedDelete = `#graphql
                mutation {
                    ${Movie.operations.delete}(delete: { actors: { where: { node: { name: "someName" } } } }) {
                        nodesDeleted
                    }
                }
            `;
        });
        test("Should only be able to perform the create nested op when CREATE is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                type ${Person} {
                    name: String
                }

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeFalsy();
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(createWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((createWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeFalsy();
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((updateWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Field "delete" is not defined by type'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the connect nested op when CONNECT is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
            type ${Person} {
                name: String
            }

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeFalsy();
            expect(createWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((createWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeFalsy();
            expect(updateWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((updateWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Field "delete" is not defined by type'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the connectOrCreate nested op when CONNECT_OR_CREATE is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                type ${Person} {
                    id: ID! @id
                    name: String
                }

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT_OR_CREATE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(createWithNestedConnectOrCreateResult.errors).toBeFalsy();
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedConnectOrCreateResult.errors).toBeFalsy();
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Field "delete" is not defined by type'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the update nested op when UPDATE is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                type ${Person} {
                    name: String
                }

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [UPDATE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((createWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((updateWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeFalsy();
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Field "delete" is not defined by type'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the disconnect nested op when DISCONNECT is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                type ${Person} {
                    name: String
                }

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DISCONNECT])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((createWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((updateWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeFalsy();
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Field "delete" is not defined by type'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the delete nested op when DELETE is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                type ${Person} {
                    name: String
                }

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DELETE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((createWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((updateWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeFalsy();
            expect(deleteWithNestedDeleteResult.errors).toBeFalsy();
        });
    });

    describe("Related to a union type", () => {
        let PersonOne: UniqueType;
        let PersonTwo: UniqueType;

        let createMutationWithNestedCreate: string;
        let createMutationWithNestedConnect: string;
        let createMutationWithNestedConnectOrCreate: string;
        let updateMutationWithNestedCreate: string;
        let updateMutationWithNestedConnect: string;
        let updateMutationWithNestedConnectOrCreate: string;
        let updateMutationWithNestedDisconnect: string;
        let updateMutationWithNestedUpdate: string;
        let updateMutationWithNestedDelete: string;
        let deleteMutationWithNestedDelete: string;

        beforeEach(() => {
            PersonOne = new UniqueType("PersonOne");
            PersonTwo = new UniqueType("PersonTwo");

            createMutationWithNestedCreate = `#graphql
                mutation {
                    ${Movie.operations.create}(input: { id: "1", actors: { ${PersonOne}: { create: { node: { name: "someName" } } } } }) {
                        info {
                            nodesCreated
                        }
                    }
                }
            `;
            createMutationWithNestedConnect = `#graphql
                mutation {
                    ${Movie.operations.create}(input: { id: "1", actors: { ${PersonOne}: { connect: { where: { node: { name: "someName" } } } } } }) {
                        info {
                            nodesCreated
                        }
                    }
                }
            `;
            createMutationWithNestedConnectOrCreate = `#graphql
                mutation {
                    ${Movie.operations.create}(
                        input: {
                            id: "1"
                            actors: {
                                ${PersonOne}: {
                                    connectOrCreate: {
                                        where: { node: { id: "1" } }
                                        onCreate: { node: { name: "someName" } }
                                    }
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
            updateMutationWithNestedCreate = `#graphql
                mutation {
                    ${Movie.operations.update}(update: { actors: { ${PersonOne}: { create: { node: { name: "someName" } } } } }) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedConnect = `#graphql
                mutation {
                    ${Movie.operations.update}(
                        update: { actors: { ${PersonOne}: { connect: { where: { node: { name: "someName" } } } } } }
                    ) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedConnectOrCreate = `#graphql
                mutation {
                    ${Movie.operations.update}(
                        update: {
                            actors: {
                                ${PersonOne}: {
                                    connectOrCreate: {
                                        where: { node: { id: "1" } }
                                        onCreate: { node: { name: "someName" } }
                                    }
                                }
                            }
                        }
                    ) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedDisconnect = `#graphql
                mutation {
                    ${Movie.operations.update}(
                        update: {
                            actors: { ${PersonOne}: { disconnect: { where: { node: { name: "someName" } } } } }
                        }
                    ) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedUpdate = `#graphql
                mutation {
                    ${Movie.operations.update}(update: { actors: { ${PersonOne}: { update: { node: { name: "someName" } } } } }) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedDelete = `#graphql
                mutation {
                    ${Movie.operations.update}(delete: { actors: { ${PersonOne}: { where: { node: { name: "someName" } } } } }) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            deleteMutationWithNestedDelete = `#graphql
                mutation {
                    ${Movie.operations.delete}(delete: { actors: { ${PersonOne}: { where: { node: { name: "someName" } } } } }) {
                        nodesDeleted
                    }
                }
            `;
        });
        test("Should only be able to perform the create nested op when CREATE is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                type ${PersonOne} {
                    name: String
                }

                type ${PersonTwo} {
                    nameTwo: String
                }

                union ${Person} = ${PersonOne} | ${PersonTwo}

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeFalsy();
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(createWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((createWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeFalsy();
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((updateWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the connect nested op when CONNECT is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                type ${PersonOne} {
                    name: String
                }

                type ${PersonTwo} {
                    nameTwo: String
                }

                union ${Person} = ${PersonOne} | ${PersonTwo}

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeFalsy();
            expect(createWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((createWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeFalsy();
            expect(updateWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((updateWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the connectOrCreate nested op when CONNECT_OR_CREATE is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                type ${PersonOne} {
                    id: ID! @id
                    name: String
                }

                type ${PersonTwo} {
                    nameTwo: String
                }

                union ${Person} = ${PersonOne} | ${PersonTwo}

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT_OR_CREATE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(createWithNestedConnectOrCreateResult.errors).toBeFalsy();
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedConnectOrCreateResult.errors).toBeFalsy();
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the update nested op when UPDATE is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                type ${PersonOne} {
                    name: String
                }

                type ${PersonTwo} {
                    nameTwo: String
                }

                union ${Person} = ${PersonOne} | ${PersonTwo}

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [UPDATE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((createWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((updateWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeFalsy();
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the disconnect nested op when DISCONNECT is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                type ${PersonOne} {
                    name: String
                }

                type ${PersonTwo} {
                    nameTwo: String
                }

                union ${Person} = ${PersonOne} | ${PersonTwo}

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DISCONNECT])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((createWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((updateWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeFalsy();
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the delete nested op when DELETE is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                type ${PersonOne} {
                    name: String
                }

                type ${PersonTwo} {
                    nameTwo: String
                }

                union ${Person} = ${PersonOne} | ${PersonTwo}

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DELETE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((createWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedConnectOrCreateResult.errors).toBeDefined();
            expect((updateWithNestedConnectOrCreateResult.errors as any)[0].message).toInclude(
                'Field "connectOrCreate" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeFalsy();
            expect(deleteWithNestedDeleteResult.errors).toBeFalsy();
        });
    });

    describe("Related to an interface type", () => {
        // TODO: add tests/expects for connectOrCreate once implemented for interfaces
        let PersonOne: UniqueType;
        let PersonTwo: UniqueType;

        let createMutationWithNestedCreate: string;
        let createMutationWithNestedConnect: string;
        let updateMutationWithNestedCreate: string;
        let updateMutationWithNestedConnect: string;
        let updateMutationWithNestedDisconnect: string;
        let updateMutationWithNestedUpdate: string;
        let updateMutationWithNestedDelete: string;
        let deleteMutationWithNestedDelete: string;

        beforeEach(() => {
            PersonOne = new UniqueType("PersonOne");
            PersonTwo = new UniqueType("PersonTwo");

            createMutationWithNestedCreate = `#graphql
                mutation {
                    ${Movie.operations.create}(input: { id: "1", actors: { create: { node: { ${PersonOne}: { name: "someName" } } } } }) {
                        info {
                            nodesCreated
                        }
                    }
                }
            `;
            createMutationWithNestedConnect = `#graphql
                mutation {
                    ${Movie.operations.create}(input: { id: "1", actors: { connect: { where: { node: { name: "someName" } } } } }) {
                        info {
                            nodesCreated
                        }
                    }
                }
            `;
            updateMutationWithNestedCreate = `#graphql
                mutation {
                    ${Movie.operations.update}(update: { actors: { create: { node: { ${PersonOne}: { name: "someName" } } } } }) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedConnect = `#graphql
                mutation {
                    ${Movie.operations.update}(
                        update: { actors: { connect: { where: { node: { name: "someName" } } } } }
                    ) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedDisconnect = `#graphql
                mutation {
                    ${Movie.operations.update}(
                        update: {
                            actors: { disconnect: { where: { node: { name: "someName" } } } }
                        }
                    ) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedUpdate = `#graphql
                mutation {
                    ${Movie.operations.update}(update: { actors: { update: { node: { name: "someName" } } } }) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            updateMutationWithNestedDelete = `#graphql
                mutation {
                    ${Movie.operations.update}(update: { actors: { delete: { where: { node: { name: "someName" } } } } }) {
                        info {
                            nodesCreated
                            nodesDeleted
                        }
                    }
                }
            `;
            deleteMutationWithNestedDelete = `#graphql
                mutation {
                    ${Movie.operations.delete}(delete: { actors: { where: { node: { name: "someName" } } } }) {
                        nodesDeleted
                    }
                }
            `;
        });
        test("Should only be able to perform the create nested op when CREATE is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                interface ${Person} {
                    name: String
                }

                type ${PersonOne} implements ${Person} {
                    name: String
                }

                type ${PersonTwo} implements ${Person} {
                    name: String
                    someOtherProperty: Int!
                }

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeFalsy();
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeFalsy();
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Field "delete" is not defined by type'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the connect nested op when CONNECT is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                interface ${Person} {
                    name: String
                }

                type ${PersonOne} implements ${Person} {
                    name: String
                }

                type ${PersonTwo} implements ${Person} {
                    name: String
                    someOtherProperty: Int!
                }

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeFalsy();
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeFalsy();
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Field "delete" is not defined by type'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });
        test("Should only be able to perform the update nested op when UPDATE is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                interface ${Person} {
                    name: String
                }

                type ${PersonOne} implements ${Person} {
                    name: String
                }

                type ${PersonTwo} implements ${Person} {
                    name: String
                    someOtherProperty: Int!
                }

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [UPDATE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeFalsy();
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Field "delete" is not defined by type'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the disconnect nested op when DISCONNECT is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                interface ${Person} {
                    name: String
                }

                type ${PersonOne} implements ${Person} {
                    name: String
                }

                type ${PersonTwo} implements ${Person} {
                    name: String
                    someOtherProperty: Int!
                }

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DISCONNECT])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeFalsy();
            expect(updateWithNestedDeleteResult.errors).toBeDefined();
            expect((updateWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Field "delete" is not defined by type'
            );
            expect(deleteWithNestedDeleteResult.errors).toBeDefined();
            expect((deleteWithNestedDeleteResult.errors as any)[0].message).toInclude(
                'Unknown argument "delete" on field'
            );
        });

        test("Should only be able to perform the delete nested op when DELETE is the only nestedOperation specified", async () => {
            const typeDefs = `#graphql
                interface ${Person} {
                    name: String
                }

                type ${PersonOne} implements ${Person} {
                    name: String
                }

                type ${PersonTwo} implements ${Person} {
                    name: String
                    someOtherProperty: Int!
                }

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DELETE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(createWithNestedCreateResult.errors).toBeDefined();
            expect((createWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(createWithNestedConnectResult.errors).toBeDefined();
            expect((createWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "actors" is not defined by type'
            );
            expect(updateWithNestedCreateResult.errors).toBeDefined();
            expect((updateWithNestedCreateResult.errors as any)[0].message).toInclude(
                'Field "create" is not defined by type'
            );
            expect(updateWithNestedConnectResult.errors).toBeDefined();
            expect((updateWithNestedConnectResult.errors as any)[0].message).toInclude(
                'Field "connect" is not defined by type'
            );
            expect(updateWithNestedUpdateResult.errors).toBeDefined();
            expect((updateWithNestedUpdateResult.errors as any)[0].message).toInclude(
                'Field "update" is not defined by type'
            );
            expect(updateWithNestedDisconnectResult.errors).toBeDefined();
            expect((updateWithNestedDisconnectResult.errors as any)[0].message).toInclude(
                'Field "disconnect" is not defined by type'
            );
            expect(updateWithNestedDeleteResult.errors).toBeFalsy();
            expect(deleteWithNestedDeleteResult.errors).toBeFalsy();
        });
    });
});

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
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/3428", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let session: Session;

    let Movie: UniqueType;
    let Person: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
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
        test("Should not error and should only be able to perform the disconnect nested op when only the DISCONNECT nestedOperation is specified on rel to a type with a unique field", async () => {
            const typeDefs = `#graphql
                type ${Person} {
                    id: ID! @id @unique
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
                contextValue: neo4j.getContextValues(),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValues(),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValues(),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValues(),
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

        test("Should only be able to perform the disconnect and connectOrCreate nested ops when DISCONNECT and CONNECT_OR_CREATE are the only nestedOperations specified", async () => {
            const typeDefs = `#graphql
                type ${Person} {
                    id: ID! @id @unique
                    name: String
                }

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DISCONNECT, CONNECT_OR_CREATE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValues(),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValues(),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValues(),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValues(),
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
    });

    describe("Related to a union", () => {
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
                                        where: { node: { name: "someName" } }
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
                                        where: { node: { name: "someName" } }
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
                    ${Movie.operations.update}(update: { actors: { ${PersonOne}: { delete: { where: { node: { name: "someName" } } } } } }) {
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

        test("Should not error and should only be able to perform the disconnect nested op when only the DISCONNECT nestedOperation is specified on rel to a type with a unique field", async () => {
            const typeDefs = `#graphql
                type ${PersonOne} {
                    name: String @unique
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
                contextValue: neo4j.getContextValues(),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValues(),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValues(),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValues(),
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

        test("Should only be able to perform the disconnect and connectOrCreate nested ops when DISCONNECT and CONNECT_OR_CREATE are the only nestedOperations specified", async () => {
            const typeDefs = `#graphql
                type ${PersonOne} {
                    name: String @unique
                }

                type ${PersonTwo} {
                    nameTwo: String
                }

                union ${Person} = ${PersonOne} | ${PersonTwo}

                type ${Movie} {
                    id: ID
                    actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DISCONNECT, CONNECT_OR_CREATE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const createWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedCreate,
                contextValue: neo4j.getContextValues(),
            });
            const createWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnect,
                contextValue: neo4j.getContextValues(),
            });
            const createWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedCreate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedConnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnect,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedConnectOrCreateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedConnectOrCreate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedUpdateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedUpdate,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedDisconnectResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDisconnect,
                contextValue: neo4j.getContextValues(),
            });
            const updateWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutationWithNestedDelete,
                contextValue: neo4j.getContextValues(),
            });
            const deleteWithNestedDeleteResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: deleteMutationWithNestedDelete,
                contextValue: neo4j.getContextValues(),
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
    });
});

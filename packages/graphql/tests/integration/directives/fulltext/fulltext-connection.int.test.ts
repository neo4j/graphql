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
import { generate } from "randomstring";
import type { DocumentNode, GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";
import { delay } from "../../../../src/utils/utils";
import { isMultiDbUnsupportedError } from "../../../utils/is-multi-db-unsupported-error";
import { testIf } from "../../../utils/test-if";
import { cleanNodes } from "../../../utils/clean-nodes";

describe("@fulltext directive - connections", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let databaseName: string;
    let MULTIDB_SUPPORT = true;
    let session: Session;

    let Movie: UniqueType;
    const partialTitle = "Matriz";
    const testTitle = `La ${partialTitle}`;
    let testIndexName: string;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        databaseName = generate({ readable: true, charset: "alphabetic" });

        const cypher = `CREATE DATABASE ${databaseName} WAIT`;
        const session = driver.session();

        try {
            await session.run(cypher);
        } catch (e) {
            if (e instanceof Error) {
                if (isMultiDbUnsupportedError(e)) {
                    // No multi-db support, so we skip tests
                    MULTIDB_SUPPORT = false;
                } else {
                    throw e;
                }
            }
        } finally {
            await session.close();
        }

        await delay(5000);
    });

    beforeEach(async () => {
        session = driver.session({ database: databaseName });
        testIndexName = generate({ readable: true, charset: "alphabetic" });

        Movie = new UniqueType("Movie");
        try {
            await session.run(`CREATE (:${Movie} { title: "${testTitle}", id: "an-id 1" })`);
            await session.run(`CREATE (:${Movie} { title: "${partialTitle}", id: "an-id 2" })`);
            await session.run(`CREATE (:${Movie} { title: "another title", id:"${testTitle}"  })`);
        } finally {
            await session.close();
        }
    });

    afterEach(async () => {
        const session = driver.session({ database: databaseName });
        try {
            await cleanNodes(session, [Movie]);
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        if (MULTIDB_SUPPORT) {
            const cypher = `DROP DATABASE ${databaseName}`;

            const session = await neo4j.getSession({ database: databaseName });
            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }
        }

        await driver.close();
    });

    async function createSchemaAndAssertIndexes(typeDefs: DocumentNode): Promise<GraphQLSchema> {
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            })
        ).resolves.not.toThrow();

        return schema;
    }

    testIf(MULTIDB_SUPPORT)("Query using fulltext index", async () => {
        const typeDefs = gql`
            type ${Movie} @fulltext(indexes: [{ name: "${testIndexName}", fields: ["title"] }]) {
                title: String!
            }
        `;

        const schema = await createSchemaAndAssertIndexes(typeDefs);

        const query = `
            query {
                ${Movie.operations.connection}(fulltext: { index: ${testIndexName}, phrase: "${partialTitle}" }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            title: testTitle,
                        },
                    },
                    {
                        node: {
                            title: partialTitle,
                        },
                    },
                ]),
            },
        });
    });

    testIf(MULTIDB_SUPPORT)("should query fulltext using node label", async () => {
        const typeDefs = gql`
            type Film @fulltext(indexes: [{ name: "${testIndexName}", fields: ["title"] }]) @node(labels: ["${Movie}"]) {
                title: String!
            }
        `;
        const schema = await createSchemaAndAssertIndexes(typeDefs);

        const query = `
            query {
                filmsConnection(fulltext: { index: ${testIndexName},  phrase: "${partialTitle}" }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            filmsConnection: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            title: testTitle,
                        },
                    },
                    {
                        node: {
                            title: partialTitle,
                        },
                    },
                ]),
            },
        });
    });

    testIf(MULTIDB_SUPPORT)("should query fulltext using field alias", async () => {
        const typeDefs = gql`
            type Film @fulltext(indexes: [{ name: "${testIndexName}", fields: ["name"] }]) @node(labels: ["${Movie}"]) {
                name: String! @alias(property: "title")
            }
        `;

        const schema = await createSchemaAndAssertIndexes(typeDefs);

        const query = `
            query {
                filmsConnection(fulltext: { index: ${testIndexName},  phrase: "${partialTitle}" }) {
                    edges {
                        node {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            filmsConnection: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            name: testTitle,
                        },
                    },
                    {
                        node: {
                            name: partialTitle,
                        },
                    },
                ]),
            },
        });
    });

    testIf(MULTIDB_SUPPORT)("should query fulltext for ID field", async () => {
        const typeDefs = gql`
            type ${Movie} @fulltext(indexes: [{ name: "${testIndexName}", fields: ["id"] }]) {
                id: ID!
                title: String!
            }
        `;

        const schema = await createSchemaAndAssertIndexes(typeDefs);

        const query = `
            query {
                ${Movie.operations.connection}(fulltext: { index: ${testIndexName}, phrase: "${partialTitle}" }) {
                    edges{
                        node {
                            id
                            title
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.connection]: {
                edges: [
                    {
                        node: {
                            id: testTitle,
                            title: "another title",
                        },
                    },
                ],
            },
        });
    });

    testIf(MULTIDB_SUPPORT)("Query using fulltext index with multiple fields", async () => {
        const typeDefs = gql`
            type ${Movie} @fulltext(indexes: [{ name: "${testIndexName}", fields: ["title", "id"] }]) {
                title: String!
                id: String!
            }
        `;

        const schema = await createSchemaAndAssertIndexes(typeDefs);

        const query = `
            query {
                ${Movie.operations.connection}(fulltext: { index: ${testIndexName}, phrase: "${partialTitle}" }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            title: testTitle,
                        },
                    },
                    {
                        node: {
                            title: partialTitle,
                        },
                    },
                    {
                        node: {
                            title: "another title",
                        },
                    },
                ]),
            },
        });
    });
});

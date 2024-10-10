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

import { createBearerToken } from "../../../../utils/create-bearer-token";
import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive filtering - Auth", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("With authorization on type", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(filter: [{ where: { node: { custom_field: "$jwt.custom_value" } } }]) {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        MATCH (this)
                        return this.custom_field AS s
                        """
                        columnName: "s"
                    )
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken("secret", { custom_value: "hello" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", custom_field: "hello" })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", custom_field: "goodbye" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural} {
                    title
                    custom_field
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    custom_field: "hello",
                },
            ],
        });
    });

    test("With authorization on @cypher field, selecting @cypher field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field AS s
                        """
                        columnName: "s"
                    )
                    @authorization(filter: [{ where: { node: { custom_field_EQ: "$jwt.custom_value" } } }])
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken("secret", { custom_value: "hello" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", custom_field: "hello" })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", custom_field: "goodbye" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural} {
                    custom_field
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    custom_field: "hello",
                },
            ],
        });
    });

    test("With authorization on @cypher field, selecting title field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field AS s
                        """
                        columnName: "s"
                    )
                    @authorization(filter: [{ where: { node: { title: "$jwt.custom_value" } } }])
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken("secret", { custom_value: "hello" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", custom_field: "hello" })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", custom_field: "goodbye" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix",
                },
                {
                    title: "The Matrix Reloaded",
                },
            ]),
        });
    });

    test("With authorization on Actor type field using nested Movie @cypher field return value", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field AS s
                        """
                        columnName: "s"
                    )
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node @authorization(filter: [{ where: { node: { movies_SOME: { custom_field: "$jwt.custom_value" } } } }]) {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken("secret", { custom_value: "hello" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", custom_field: "hello" })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", custom_field: "goodbye" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a2:${Actor} { name: "Jada Pinkett Smith" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a2)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = `
            query {
                ${Actor.plural} {
                    name
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Actor.plural]: [
                {
                    name: "Keanu Reeves",
                },
            ],
        });
    });

    test("With authorization on a different field than the @cypher field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String @authorization(filter: [{ where: { node: { custom_field: "$jwt.custom_value" } } }])
                custom_field: String
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field AS s
                        """
                        columnName: "s"
                    )
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken("secret", { custom_value: "hello" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", custom_field: "hello" })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", custom_field: "goodbye" })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions", custom_field: "hello" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix",
                },
                {
                    title: "The Matrix Revolutions",
                },
            ]),
        });
    });

    test("With authorization on type using @cypher return value, with validate FAIL", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(validate: [{ where: { node: { custom_field: "$jwt.custom_value" } } }]) {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field AS s
                        """
                        columnName: "s"
                    )
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken("secret", { custom_value: "hello" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", custom_field: "hello" })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Forbidden");
    });

    test("With authorization on type using @cypher return value, with validate PASS", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(validate: [{ where: { node: { custom_field: "$jwt.custom_value" } } }]) {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field AS s
                        """
                        columnName: "s"
                    )
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken("secret", { custom_value: "hello" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", custom_field: "hello" })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", custom_field: "hello" })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions", custom_field: "hello" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix",
                },
                {
                    title: "The Matrix Reloaded",
                },
                {
                    title: "The Matrix Revolutions",
                },
            ]),
        });
    });
});

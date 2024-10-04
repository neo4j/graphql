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

describe("cypher directive filtering - List Auth", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("With authorization on type, selecting @cypher field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(filter: [{ where: { node: { custom_field_INCLUDES: "$jwt.custom_value" } } }]) {
                title: String
                custom_field: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as list
                        """
                        columnName: "list"
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

        const token = createBearerToken("secret", { custom_value: "a" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", custom_field: ['a','b','c'] })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", custom_field: ['d','e','f'] })
            CREATE (a:${Actor} { name: "Keanu Reeves"} )
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = /* GraphQL */ `
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
                    custom_field: ["a", "b", "c"],
                },
            ],
        });
    });

    test("With authorization on type, selecting title", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(filter: [{ where: { node: { custom_field_INCLUDES: "$jwt.custom_value" } } }]) {
                title: String
                custom_field: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as list
                        """
                        columnName: "list"
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

        const token = createBearerToken("secret", { custom_value: "a" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", custom_field: ['a','b','c'] })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", custom_field: ['d','e','f'] })
            CREATE (a:${Actor} { name: "Keanu Reeves"} )
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                },
            ],
        });
    });

    test("With authorization on @cypher field, select @cypher field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                custom_field: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as list
                        """
                        columnName: "list"
                    )
                    @authorization(filter: [{ where: { node: { custom_field_INCLUDES: "$jwt.custom_value" } } }])
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

        const token = createBearerToken("secret", { custom_value: "a" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", custom_field: ['a','b','c'] })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", custom_field: ['d','e','f'] })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = /* GraphQL */ `
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
                    custom_field: ["a", "b", "c"],
                },
            ],
        });
    });

    test("With authorization on @cypher field using, selecting title (no authorization required)", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                custom_field: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as list
                        """
                        columnName: "list"
                    )
                    @authorization(filter: [{ where: { node: { custom_field: "$jwt.custom_value" } } }])
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

        const token = createBearerToken("secret", { custom_value: "a" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", custom_field: ['a','b','c'] })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", custom_field: ['d','e','f'] })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = /* GraphQL */ `
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

    test("With authorization on Actor type field using nested Movie's @cypher field return value", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                custom_field: [String]
                    @cypher(
                        statement: """
                        RETURN ['a', 'b', 'c'] as list
                        """
                        columnName: "list"
                    )
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node @authorization(filter: [{ where: { node: { movies_SOME: { custom_field_INCLUDES: "$jwt.custom_value" } } } }]) {
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

        const token = createBearerToken("secret", { custom_value: "a" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
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
                title: String @authorization(filter: [{ where: { node: { custom_field_INCLUDES: "$jwt.custom_value" } } }])
                custom_field: [String]
                    @cypher(
                        statement: """
                        RETURN ['a', 'b', 'c'] as list
                        """
                        columnName: "list"
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

        const token = createBearerToken("secret", { custom_value: "a" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                },
            ],
        });
    });

    test("With authorization on type using @cypher return value, with validate FAIL", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(validate: [{ where: { node: { custom_field_INCLUDES: "$jwt.custom_value" } } }]) {
                title: String
                custom_field: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as list
                        """
                        columnName: "list"
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

        const token = createBearerToken("secret", { custom_value: "a" });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (m2:${Movie} { title: "The Matrix 2", custom_field: ['a','b','c'] })
            CREATE (m3:${Movie} { title: "The Matrix 3" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
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
            type ${Movie} @node @authorization(validate: [{ where: { node: { custom_field_INCLUDES: "$jwt.custom_value" } } }]) {
                title: String
                custom_field: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as list
                        """
                        columnName: "list"
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

        const token = createBearerToken("secret", { custom_value: "a" });

        await testHelper.executeCypher(
            `
            CREATE (m2:${Movie} { title: "The Matrix", custom_field: ['a','b','c'] })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                },
            ],
        });
    });
});

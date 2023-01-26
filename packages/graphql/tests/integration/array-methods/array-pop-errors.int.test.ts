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
import { graphql, GraphQLError } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";
import { UniqueType } from "../../utils/graphql-types";

describe("array-pop-errors", () => {
    let driver: Driver;
    let session: Session;
    let neo4j: Neo4j;
    const jwtPlugin = new Neo4jGraphQLAuthJWTPlugin({
        secret: "secret",
    });

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });
    test("should throw an error when trying to pop an element from a non-existing array", async () => {
        const typeMovie = new UniqueType("Movie");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [String]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${typeMovie.operations.update} (update: { tags_POP: 1 }) {
                    ${typeMovie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

        // Created deliberately without the tags property.
        const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle})
        `;

        await session.run(cypher, { movieTitle });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Property tags cannot be NULL"))
        ).toBeTruthy();

        expect(gqlResult.data).toBeNull();
    });

    test("should throw an error when trying to pop an element from multiple non-existing arrays", async () => {
        const typeMovie = new UniqueType("Movie");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [String]
                otherTags: [String]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${typeMovie.operations.update} (update: { tags_POP: 1, otherTags_POP: 1 }) {
                    ${typeMovie.plural} {
                        title
                        tags
                        otherTags
                    }
                }
            }
        `;

        // Created deliberately without the tags or otherTags properties.
        const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle})
        `;

        await session.run(cypher, { movieTitle });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as GraphQLError[]).some((el) =>
                el.message.includes("Properties tags, otherTags cannot be NULL")
            )
        ).toBeTruthy();

        expect(gqlResult.data).toBeNull();
    });

    test("should throw an error if not authenticated on field definition", async () => {
        const typeMovie = new UniqueType("Movie");
        const typeDefs = `
            type ${typeMovie} {
                title: String
                tags: [String] @auth(rules: [{
                    operations: [UPDATE],
                    isAuthenticated: true
                }])
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${typeMovie.operations.update} (update: { tags_POP: 1 }) {
                    ${typeMovie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: ['a', 'b']})
        `;

        await session.run(cypher, { movieTitle });

        const token = "not valid token";

        const socket = new Socket({ readable: true });
        const req = new IncomingMessage(socket);
        req.headers.authorization = `Bearer ${token}`;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Unauthenticated"))).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });

    test("should throw an error when input is invalid", async () => {
        const typeMovie = new UniqueType("Movie");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [String]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${typeMovie.operations.update} (update: { tags_POP: a }) {
                    ${typeMovie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: ["abc", "xyz"]})
        `;

        await session.run(cypher, { movieTitle });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as GraphQLError[]).some((el) =>
                el.message.includes("Int cannot represent non-integer value")
            )
        ).toBeTruthy();

        expect(gqlResult.data).toBeUndefined();
    });

    test("should throw an error when performing an ambiguous property update", async () => {
        const typeMovie = new UniqueType("Movie");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [String]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${typeMovie.operations.update} (update: { tags_POP: 1, tags: [] }) {
                    ${typeMovie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags:["existing value"]})
        `;

        await session.run(cypher, { movieTitle });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as GraphQLError[]).some((el) =>
                el.message.includes("Cannot mutate the same field multiple times in one Mutation")
            )
        ).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });

    test("should throw an error when performing an ambiguous property update on relationship properties", async () => {
        const initialPay = 100;
        const movie = new UniqueType("Movie");
        const actor = new UniqueType("Actor");
        const typeDefs = `
            type ${movie.name} {
                title: String
                actors: [${actor.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }
            
            type ${actor.name} {
                id: ID!
                name: String!
                actedIn: [${movie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn @relationshipProperties {
                pay: [Float]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation Mutation($id: ID, $numberToPop: Int) {
                ${actor.operations.update}(where: { id: $id }, update: {
                    actedIn: [
                        {
                            update: {
                                edge: {
                                    pay: [],
                                    pay_POP: $numberToPop
                                }
                            }
                        }
                    ]
                }) {
                    ${actor.plural} {
                        name
                        actedIn {
                            title
                        }
                        actedInConnection {
                            edges {
                                pay
                            }
                        }
                    }
                }
            }
        `;

        // Create new movie
        await session.run(
            `
                CREATE (a:${movie.name} {title: "The Matrix"}), (b:${actor.name} {id: $id, name: "Keanu"}) WITH a,b CREATE (a)<-[actedIn: ACTED_IN{ pay: $initialPay }]-(b) RETURN a, actedIn, b
                `,
            {
                id,
                initialPay: [initialPay],
            }
        );
        // Update movie
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id, numberToPop: 1 },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as GraphQLError[]).some((el) =>
                el.message.includes("Cannot mutate the same field multiple times in one Mutation")
            )
        ).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });
});

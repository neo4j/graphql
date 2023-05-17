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
import type { GraphQLError } from "graphql";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";
import { UniqueType } from "../../utils/graphql-types";

describe("array-pop-and-push", () => {
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
                moreTags: [String]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${typeMovie.operations.update} (update: { tags_PUSH: "xyz", moreTags_POP: 2 }) {
                    ${typeMovie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: ["abc"] })
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
            (gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("moreTags cannot be NULL"))
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
                moreTags: [String]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${typeMovie.operations.update} (update: { tags_POP: 1, moreTags_PUSH: "new tag" }) {
                    ${typeMovie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: ['a', 'b'], moreTags: []})
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
                moreTags: [String]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${typeMovie.operations.update} (update: { tags_PUSH: 1, moreTags_POP: 2 }) {
                    ${typeMovie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: ["abc"], moreTags: ["this", "that", "them"] })
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
                el.message.includes("String cannot represent a non string value")
            )
        ).toBeTruthy();

        expect(gqlResult.data).toBeUndefined();
    });
});

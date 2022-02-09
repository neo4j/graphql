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
import { Driver, Session, Integer } from "neo4j-driver";
import { graphql, DocumentNode } from "graphql";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../utils/graphql-types";
import { getQuerySource } from "../../utils/get-query-source";
import { createJwtRequest } from "../../utils/create-jwt-request";

describe("Update -> ConnectOrCreate", () => {
    let driver: Driver;
    let session: Session;
    let typeDefs: DocumentNode;
    let queryUpdate: DocumentNode;
    let queryCreate: DocumentNode;

    const typeMovie = generateUniqueType("Movie");
    const typeGenre = generateUniqueType("Genre");
    const secret = "secret";
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();

        typeDefs = gql`
        type ${typeMovie.name} {
            title: String
            genres: [${typeGenre.name}!]! @relationship(type: "IN_GENRE", direction: OUT)
        }

        type ${typeGenre.name} @auth(rules: [{ operations: [CONNECT, CREATE], roles: ["admin"] }]) {
            name: String @unique
        }
        `;

        queryUpdate = gql`
            mutation {
              ${typeMovie.operations.update}(
                update: {
                    title: "Forrest Gump 2"
                    genres: {
                      connectOrCreate: {
                        where: { node: { name: "Horror" } }
                        onCreate: { node: { name: "Horror" } }
                      }
                    }
                  }
              ) {
                ${typeMovie.plural} {
                  title
                }
              }
            }
            `;

        queryCreate = gql`
            mutation {
                ${typeMovie.operations.create}(
                    input: [
                        {
                            title: "Cool Movie"
                            genres: {
                                connectOrCreate: {
                                    where: { node: { name: "Comedy" } },
                                    onCreate: { node: { name: "Comedy" } }
                                }
                            }
                        }
                    ]
                ) {
                    ${typeMovie.plural} {
                        title
                    }
                }
            }
            `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {
                jwt: {
                    secret,
                },
            },
        });
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.run(`MATCH (m:${typeMovie.name}) DETACH DELETE m`);
        await session.run(`MATCH (g:${typeGenre.name}) DETACH DELETE g`);

        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("cannot update with ConnectOrCreate auth", async () => {
        await session.run(`CREATE (:${typeMovie.name} { title: "RandomMovie1"})`);
        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: getQuerySource(queryUpdate),
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("update with ConnectOrCreate auth", async () => {
        await session.run(`CREATE (:${typeMovie.name} { title: "Forrest Gump"})`);
        const req = createJwtRequest(secret, { roles: ["admin"] });

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: getQuerySource(queryUpdate),
            contextValue: { driver, req, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });
        expect(gqlResult.errors).toBeUndefined();

        const genreCount = await session.run(`
          MATCH (m:${typeGenre.name} { name: "Horror" })
          RETURN COUNT(m) as count
        `);
        expect((genreCount.records[0].toObject().count as Integer).toNumber()).toBe(1);
    });

    test("create with ConnectOrCreate auth", async () => {
        const req = createJwtRequest(secret, { roles: ["admin"] });

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: getQuerySource(queryCreate),
            contextValue: { driver, req, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });
        expect(gqlResult.errors).toBeUndefined();

        const genreCount = await session.run(`
          MATCH (m:${typeGenre.name} { name: "Comedy" })
          RETURN COUNT(m) as count
        `);
        expect((genreCount.records[0].toObject().count as Integer).toNumber()).toBe(1);
    });
});

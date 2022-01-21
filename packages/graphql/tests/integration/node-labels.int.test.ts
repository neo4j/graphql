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

import { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { generateUniqueType } from "../utils/graphql-types";
import { createJwtRequest } from "../utils/create-jwt-request";

describe("Node directive labels", () => {
    let driver: Driver;
    let session: Session;

    const typeFilm = generateUniqueType("Film");

    beforeAll(async () => {
        driver = await neo4j();
        session = driver.session();

        await session.run(`CREATE (m:${typeFilm.name} {title: "The Matrix",year:1999})`);
    });

    afterAll(async () => {
        await driver.close();
        await session.close();
    });

    test("custom labels", async () => {
        const typeDefs = `type Movie @node(label: "${typeFilm.name}") {
            id: ID
            title: String
        }`;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = `query {
            movies {
                title
                }
            }`;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data.movies[0]).toEqual({
            title: "The Matrix",
        });
    });

    test("custom jwt labels", async () => {
        const typeDefs = `type Movie @node(label: "$jwt.filmLabel") {
            id: ID
            title: String
        }`;

        const secret = "1234";

        const req = createJwtRequest(secret, { filmLabel: typeFilm.name });

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {
                jwt: {
                    secret,
                },
            },
        });

        const query = `query {
            movies {
                title
                }
            }`;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, req, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data.movies[0]).toEqual({
            title: "The Matrix",
        });
    });

    test("custom context labels", async () => {
        const typeDefs = `type Movie @node(label: "$context.filmLabel") {
            id: ID
            title: String
        }`;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = `query {
            movies {
                title
                }
            }`;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, filmLabel: typeFilm.name, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data.movies[0]).toEqual({
            title: "The Matrix",
        });
    });
});

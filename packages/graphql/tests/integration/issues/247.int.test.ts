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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/247", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return the correct number of results following connect", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                owners: [User] @relationship(type: "OWNS", direction: IN)
            }

            type User {
                name: String!
                movies: [Movie] @relationship(type: "OWNS", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const name = generate({ charset: "alphabetic" });

        const title1 = generate({ charset: "alphabetic" });
        const title2 = generate({ charset: "alphabetic" });
        const title3 = generate({ charset: "alphabetic" });

        const createUsers = `
            mutation CreateUser($name: String!) {
                createUsers(input: [{ name: $name }]) {
                    users {
                        name
                    }
                }
            }
        `;

        const createMovies = `
            mutation CreateMovies($title1: String!, $title2: String!, $title3: String!) {
                createMovies(input: [{ title: $title1 }, { title: $title2 }, { title: $title3 }]) {
                    movies {
                        title
                    }
                }
            }
        `;

        const connect = `
            mutation Connect($name: String, $title2: String, $title3: String) {
                updateUsers(
                    where: { name: $name }
                    connect: { movies: [{ where: { node: { title_IN: [$title2, $title3] } } }] }
                ) {
                    users {
                        name
                        movies {
                            title
                        }
                    }
                }
            }
        `;

        const createUsersResult = await graphql({
            schema: neoSchema.schema,
            source: createUsers,
            variableValues: { name },
            contextValue: { driver },
        });

        expect(createUsersResult.errors).toBeFalsy();
        expect(createUsersResult.data?.createUsers.users).toEqual([{ name }]);

        const createMoviesResult = await graphql({
            schema: neoSchema.schema,
            source: createMovies,
            variableValues: { title1, title2, title3 },
            contextValue: { driver },
        });

        expect(createMoviesResult.errors).toBeFalsy();
        expect(createMoviesResult.data?.createMovies.movies).toEqual([
            { title: title1 },
            { title: title2 },
            { title: title3 },
        ]);

        const connectResult = await graphql({
            schema: neoSchema.schema,
            source: connect,
            variableValues: { name, title2, title3 },
            contextValue: { driver },
        });

        expect(connectResult.errors).toBeFalsy();
        expect(connectResult.data?.updateUsers.users).toHaveLength(1);
        expect(connectResult.data?.updateUsers.users[0].name).toEqual(name);
        expect(connectResult.data?.updateUsers.users[0].movies).toHaveLength(2);
        expect(connectResult.data?.updateUsers.users[0].movies).toContainEqual({ title: title2 });
        expect(connectResult.data?.updateUsers.users[0].movies).toContainEqual({ title: title3 });
    });
});

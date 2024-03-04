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

import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/247", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let Movie: UniqueType;
    let User: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Movie = new UniqueType("Movie");
        User = new UniqueType("User");
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return the correct number of results following connect", async () => {
        const typeDefs = gql`
           type ${Movie} {
                title: String!
                owners: [${User}!]! @relationship(type: "OWNS", direction: IN)
            }

            type ${User} {
                name: String!
                movies: [${Movie}!]! @relationship(type: "OWNS", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const name = generate({ charset: "alphabetic" });

        const title1 = generate({ charset: "alphabetic" });
        const title2 = generate({ charset: "alphabetic" });
        const title3 = generate({ charset: "alphabetic" });

        const createUsers = `
            mutation CreateUser($name: String!) {
                ${User.operations.create}(input: [{ name: $name }]) {
                    ${User.plural} {
                        name
                    }
                }
            }
        `;

        const createMovies = `
            mutation CreateMovies($title1: String!, $title2: String!, $title3: String!) {
                ${Movie.operations.create}(input: [{ title: $title1 }, { title: $title2 }, { title: $title3 }]) {
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

        const connect = `
            mutation Connect($name: String, $title2: String!, $title3: String!) {
                ${User.operations.update}(
                    where: { name: $name }
                    connect: { movies: [{ where: { node: { title_IN: [$title2, $title3] } } }] }
                ) {
                    ${User.plural} {
                        name
                        movies {
                            title
                        }
                    }
                }
            }
        `;

        const createUsersResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: createUsers,
            variableValues: { name },
            contextValue: neo4j.getContextValues(),
        });

        expect(createUsersResult.errors).toBeFalsy();
        expect((createUsersResult.data as any)[User.operations.create][User.plural]).toEqual([{ name }]);

        const createMoviesResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: createMovies,
            variableValues: { title1, title2, title3 },
            contextValue: neo4j.getContextValues(),
        });

        expect(createMoviesResult.errors).toBeFalsy();
        expect((createMoviesResult.data as any)[Movie.operations.create][Movie.plural]).toEqual([
            { title: title1 },
            { title: title2 },
            { title: title3 },
        ]);

        const connectResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: connect,
            variableValues: { name, title2, title3 },
            contextValue: neo4j.getContextValues(),
        });

        expect(connectResult.errors).toBeFalsy();
        expect((connectResult.data as any)[User.operations.update][User.plural]).toHaveLength(1);
        expect((connectResult.data as any)[User.operations.update][User.plural][0].name).toEqual(name);
        expect((connectResult.data as any)[User.operations.update][User.plural][0].movies).toHaveLength(2);
        expect((connectResult.data as any)[User.operations.update][User.plural][0].movies).toContainEqual({
            title: title2,
        });
        expect((connectResult.data as any)[User.operations.update][User.plural][0].movies).toContainEqual({
            title: title3,
        });
    });
});

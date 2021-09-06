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
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("enums", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a movie (with a custom enum)", async () => {
        const session = driver.session();

        const statusResolver = {
            ACTIVE: "active",
        };

        const typeDefs = `
            enum Status {
                ACTIVE
            }

            type Movie {
              id: ID
              status: Status
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers: { Status: statusResolver } });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                createMovies(input:[{id: "${id}", status: ACTIVE}]) {
                    movies {
                        id
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .status} as m
            `);

            expect((result.records[0].toObject() as any).m).toEqual({ id, status: "active" });
        } finally {
            await session.close();
        }
    });
});

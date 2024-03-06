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
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/567", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let typeDefs: string;
    let Movie: UniqueType;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Movie = new UniqueType("Movie");
        typeDefs = `
        type ${Movie} {
            id: ID!
            title: String!
        }
    `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not throw when only returning info on update", async () => {
        const session = await neo4j.getSession();

        const movieId = generate({
            charset: "alphabetic",
        });

        const existingTitle = generate({
            charset: "alphabetic",
        });

        const newTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                ${Movie.operations.update}(where: { id: "${movieId}" }, update: { title: "${newTitle}" }) {
                    info {
                        nodesCreated
                        nodesDeleted
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:${Movie} { id: "${movieId}", title: "${existingTitle}" })
            `);

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (result.errors) {
                console.log(JSON.stringify(result.errors, null, 2));
            }

            expect(result.errors).toBeFalsy();

            expect(result.data as any).toEqual({
                [Movie.operations.update]: {
                    info: {
                        nodesCreated: 0,
                        nodesDeleted: 0,
                    },
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should not throw when only returning info on create", async () => {
        const session = await neo4j.getSession();

        const movieId = generate({
            charset: "alphabetic",
        });

        const existingTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                ${Movie.operations.create}(input: [{ id: "${movieId}", title: "${existingTitle}" }]) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        try {
            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (result.errors) {
                console.log(JSON.stringify(result.errors, null, 2));
            }

            expect(result.errors).toBeFalsy();

            expect(result.data as any).toEqual({
                [Movie.operations.create]: {
                    info: {
                        nodesCreated: 1,
                    },
                },
            });
        } finally {
            await session.close();
        }
    });
});

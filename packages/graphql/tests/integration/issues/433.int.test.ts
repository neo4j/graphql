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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("433", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should recreate issue and return correct data", async () => {
        const session = await neo4j.getSession();

        const typeDefs = gql`
            # Cannot use 'type Node'
            type Movie {
                title: String
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Person {
                name: String
            }
        `;

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const personName = generate({
            charset: "alphabetic",
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            query {
                movies(where: {title: "${movieTitle}"}) {
                    title
                    actorsConnection(where: {}) {
                      edges {
                        node {
                          name
                        }
                      }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:Movie {title: $movieTitle})<-[:ACTED_IN]-(:Person {name: $personName})
                `,
                { movieTitle, personName }
            );

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeFalsy();

            expect(result.data as any).toEqual({
                movies: [
                    {
                        title: movieTitle,
                        actorsConnection: {
                            edges: [{ node: { name: personName } }],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });
});

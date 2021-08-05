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
import { gql } from "apollo-server";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/387", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return custom scalars from custom Cypher fields", async () => {
        const session = driver.session();

        const name = generate({
            charset: "alphabetic",
        });
        const url = generate({
            charset: "alphabetic",
        });

        const typeDefs = gql`
            scalar URL

            type Place {
                name: String
                url: URL
                    @cypher(
                        statement: """
                        return '${url}'
                        """
                    )
                url_array: [URL]
                    @cypher(
                        statement: """
                        return ['${url}', '${url}']
                        """
                    )
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            {
                places(where: { name: "${name}" }) {
                    name
                    url
                    url_array
                }
            }
        `;

        try {
            await session.run(`CREATE (:Place { name: "${name}" })`);

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result.data as any).toEqual({
                places: [
                    {
                        name,
                        url,
                        url_array: [url, url],
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("should return custom scalars from root custom Cypher fields", async () => {
        const url = generate({
            charset: "alphabetic",
        });

        const typeDefs = gql`
            scalar URL

            type Query {
                url: URL
                    @cypher(
                        statement: """
                        return '${url}'
                        """
                    )
                url_array: [URL]
                    @cypher(
                        statement: """
                        return ['${url}', '${url}']
                        """
                    )
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            {
                url
                url_array
            }
        `;

        const result = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver },
        });

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            url,
            url_array: [url, url],
        });
    });
});

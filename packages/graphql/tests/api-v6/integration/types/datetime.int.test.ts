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

import neo4jDriver from "neo4j-driver";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("DateTime", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should find a movie (with a DateTime)", async () => {
        const typeDefs = /* GraphQL */ `
                type ${Movie.name} @node {
                    datetime: DateTime
                }
            `;

        const date = new Date();

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
                query {
                    ${Movie.plural}(where: { edges: { node: { datetime: { equals: "${date.toISOString()}" }} }}) {
                        connection{
                            edges  {
                                node {
                                    datetime
                                }
                            }
                        }
                    }
                }
            `;

        const nDateTime = neo4jDriver.types.DateTime.fromStandardDate(date);

        await testHelper.executeCypher(
            `
                   CREATE (m:${Movie.name})
                   SET m.datetime = $nDateTime
               `,
            { nDateTime }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Movie.plural]).toEqual({
            connection: {
                edges: [
                    {
                        node: {
                            datetime: date.toISOString(),
                        },
                    },
                ],
            },
        });
    });

    test("should find a movie (with a DateTime created with a timezone)", async () => {
        const typeDefs = /* GraphQL */ `
                type ${Movie.name} @node {
                    name: String
                    datetime: DateTime
                }
            `;

        const date = new Date();

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
                query {
                    ${Movie.plural}(where: { edges: { node: { name: { equals:  "${Movie.name}" } } } }) {
                        connection {
                            edges {
                                node {
                                    datetime
                                }
                            }
                        }
                    }
                }
            `;

        await testHelper.executeCypher(`
                   CREATE (m:${Movie.name})
                   SET m.name = "${Movie.name}"
                   SET m.datetime = datetime("${date.toISOString().replace("Z", "[Etc/UTC]")}")
               `);

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Movie.plural]).toEqual({
            connection: {
                edges: [
                    {
                        node: {
                            datetime: date.toISOString(),
                        },
                    },
                ],
            },
        });
    });
});

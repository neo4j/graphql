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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2766", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Actor} {
                name: String!
                movies(title: String): [${Movie}]
                    @cypher(
                        statement: """
                        MATCH (this)-[]-(m:${Movie} {title: $title})
                        RETURN m
                        """,
                        columnName: "m"
                    )
            }

            type ${Movie} {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
                CREATE (a:${Actor} {name: "arthur"})-[:ACTED_IN]->(:${Movie} { title: "some title"})
                CREATE (a)-[:ACTED_IN]->(:${Movie} { title: "another title"})
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return nested Cypher fields", async () => {
        const query = `
            {
                ${Actor.plural} {
                    name
                    movies(title: "some title") {
                        title
                        actors {
                            name
                            movies(title: "another title") {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: [
                {
                    name: "arthur",
                    movies: [
                        {
                            title: "some title",
                            actors: [
                                {
                                    name: "arthur",
                                    movies: [
                                        {
                                            title: "another title",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });
});

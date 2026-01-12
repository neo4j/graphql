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

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("cypher directive sort", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String!
                actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                ranking: Int! @cypher(statement: """
                    RETURN this.rank as ranking
                """, columnName: "ranking")
            }

        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("order nested relationship by relationship properties DESC", async () => {
        const source = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                    actorsConnection(sort: {node: {ranking: DESC}}) {
                        edges {
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `CREATE(m:${Movie} {title: "The Matrix"})<-[:ACTED_IN]-(:${Actor} {name: "Main actor", rank: 1})
            CREATE(m)<-[:ACTED_IN]-(:${Actor} {name: "Second actor", rank: 2})`
        );

        const gqlResult = await testHelper.executeGraphQL(source);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    actorsConnection: {
                        edges: [
                            {
                                node: {
                                    name: "Second actor",
                                },
                            },
                            {
                                node: {
                                    name: "Main actor",
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
    test("order nested relationship by relationship properties ASC", async () => {
        const source = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                    actorsConnection(sort: {node: {ranking: ASC}}) {
                        edges {
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `CREATE(m:${Movie} {title: "The Matrix"})<-[:ACTED_IN]-(:${Actor} {name: "Main actor", rank: 1})
            CREATE(m)<-[:ACTED_IN]-(:${Actor} {name: "Second actor", rank: 2})`
        );

        const gqlResult = await testHelper.executeGraphQL(source);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    actorsConnection: {
                        edges: [
                            {
                                node: {
                                    name: "Main actor",
                                },
                            },
                            {
                                node: {
                                    name: "Second actor",
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});

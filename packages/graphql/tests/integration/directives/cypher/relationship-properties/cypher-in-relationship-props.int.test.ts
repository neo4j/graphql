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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive in relationship properties", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Actor} @node {
                name: String!
                actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTimeHours: Float
                    @cypher(
                        statement: """
                        RETURN this.screenTimeMinutes / 60 AS c
                        """
                        columnName: "c"
                    )
                screenTimeMinutes: Int
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should query custom query and return relationship properties", async () => {
        const source = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                    actorsConnection {
                        edges {
                            properties {
                                screenTimeHours
                            }
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `CREATE(:${Movie} {title: "The Matrix"})<-[:ACTED_IN {screenTimeMinutes: 120}]-(:${Actor} {name: "Keanu"})`
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
                                properties: {
                                    screenTimeHours: 2.0,
                                },
                                node: {
                                    name: "Keanu",
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });

    test("filter by relationship @cypher property without projection", async () => {
        const source = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                    actorsConnection(where: {edge: {screenTimeHours: {gt: 1.0}}}) {
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
            `CREATE(m:${Movie} {title: "The Matrix"})<-[:ACTED_IN {screenTimeMinutes: 120}]-(:${Actor} {name: "Main actor"})
            CREATE(m)<-[:ACTED_IN {screenTimeMinutes: 80}]-(:${Actor} {name: "Second actor"})`
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
                        ],
                    },
                },
            ],
        });
    });

    test("filter by relationship @cypher property with projection", async () => {
        const source = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                    actorsConnection(where: {edge: {screenTimeHours: {gt: 1.0}}}) {
                        edges {
                            node {
                                name
                            }
                            properties {
                                screenTimeHours
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `CREATE(m:${Movie} {title: "The Matrix"})<-[:ACTED_IN {screenTimeMinutes: 120}]-(:${Actor} {name: "Main actor"})
            CREATE(m)<-[:ACTED_IN {screenTimeMinutes: 80}]-(:${Actor} {name: "Second actor"})`
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
                                properties: {
                                    screenTimeHours: 2.0,
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });

    test("filter nested relationship by @cypher property with projection", async () => {
        const source = /* GraphQL */ `
            query {
                ${Movie.plural}(where: {actorsConnection: {some: {edge: {screenTimeHours: {gt: 1.5}}}}}) {
                    title
                    actorsConnection {
                        edges {
                            node {
                                name
                            }
                            properties {
                                screenTimeHours
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `CREATE(m:${Movie} {title: "The Matrix"})<-[:ACTED_IN {screenTimeMinutes: 120}]-(:${Actor} {name: "Main actor"})
            CREATE(:${Movie} {title: "The Matrix Reloaded"})<-[:ACTED_IN {screenTimeMinutes: 80}]-(:${Actor} {name: "Second actor"})`
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
                                properties: {
                                    screenTimeHours: 2.0,
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});

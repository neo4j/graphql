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

describe("https://github.com/neo4j/graphql/issues/6005", () => {
    let Movie: UniqueType;
    let Actor: UniqueType;

    const testHelper = new TestHelper();

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
                age: Int!
                born: DateTime!
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screentime: Int!
                character: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (m:${Movie} { title: "Terminator"})
            CREATE (m)<-[:ACTED_IN { screentime: 60, character: "Terminator" }]-(arnold:${Actor} { name: "Arnold", age: 54, born: datetime('1980-07-02')})
            CREATE (m)<-[:ACTED_IN { screentime: 120, character: "Sarah" }]-(:${Actor} {name: "Linda", age: 37, born: datetime('2000-02-02')})
            CREATE (m)<-[:ACTED_IN { screentime: 10, character: "Future Terminator" }]-(arnold)
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });
    /**
     * For the following tests we assuming that the deprecated syntax keep the existing behavior while when using the new syntax the
     * distinct is applied.
     **/
    test("should count actors with duplicate results (deprecated syntax)", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    actorsAggregate {
                        count
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    actorsAggregate: {
                        count: 3,
                    },
                },
            ],
        });
    });

    test("should sum actor ages actor with duplicate nodes (deprecated syntax)", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    actorsAggregate {
                        node {
                            age {
                                sum
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    actorsAggregate: {
                        node: {
                            age: {
                                sum: 145,
                            },
                        },
                    },
                },
            ],
        });
    });
    // TODO: test the field-level tests for deprecated syntax

    test("should count actors with unique results (connection syntax)", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    actorsConnection {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    actorsConnection: {
                        aggregate: {
                            count: {
                                nodes: 2,
                            },
                        },
                    },
                },
            ],
        });
    });

    test("should sum actor ages actor with unique nodes (connection syntax)", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    actorsConnection {
                        aggregate {
                            node {
                                age {
                                    sum
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    actorsConnection: {
                        aggregate: {
                            node: {
                                age: {
                                    sum: 91,
                                },
                            },
                        },
                    },
                },
            ],
        });
    });

    // TODO: test the field-level tests for connection syntax
});

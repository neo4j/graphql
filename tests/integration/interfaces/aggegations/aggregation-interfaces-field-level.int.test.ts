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

import { TestHelper } from "../../../utils/tests-helper";

describe("Interface Field Level Aggregations", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    const Production = testHelper.createUniqueType("Production");
    const Movie = testHelper.createUniqueType("Movie");
    const Actor = testHelper.createUniqueType("Actor");
    const Series = testHelper.createUniqueType("Series");

    beforeAll(async () => {
        typeDefs = /* GraphQL */ `
            interface ${Production} {
                title: String!
                cost: Float!
            }

            type ${Movie} implements ${Production} {
                title: String!
                cost: Float!
                runtime: Int!
                ${Actor.plural}: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements ${Production} {
                title: String!
                cost: Float!
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type ${Actor} {
                name: String!
                actedIn: [${Production}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            // Create Movies
            CREATE (m1:${Movie} { title: "Movie One", cost: 10000000, runtime: 120 })
            CREATE (m2:${Movie} { title: "Movie Two", cost: 20000000, runtime: 90 })
            CREATE (m3:${Movie} { title: "Movie Three", cost: 12000000, runtime: 70 })
            
            // Create Series
            CREATE (s1:${Series} { title: "Series One", cost: 10000000, episodes: 10 })
            CREATE (s2:${Series} { title: "Series Two", cost: 20000000, episodes: 20 })
            CREATE (s3:${Series} { title: "Series Three", cost: 20000000, episodes: 15 })
            
            // Create Actors
            CREATE (a1:${Actor} { name: "Actor One" })
            CREATE (a2:${Actor} { name: "Actor Two" })
            
            // Associate Actor 1 with Movies and Series
            CREATE (a1)-[:ACTED_IN { screenTime: 100 }]->(m1)
            CREATE (a1)-[:ACTED_IN { screenTime: 82 }]->(s1)
            CREATE (a1)-[:ACTED_IN { screenTime: 20 }]->(m3)
            CREATE (a1)-[:ACTED_IN { screenTime: 22 }]->(s3)
            
            // Associate Actor 2 with Movies and Series
            CREATE (a2)-[:ACTED_IN { screenTime: 240 }]->(m2)
            CREATE (a2)-[:ACTED_IN { screenTime: 728 }]->(s2)
            CREATE (a2)-[:ACTED_IN { screenTime: 728 }]->(m3)
            CREATE (a2)-[:ACTED_IN { screenTime: 88 }]->(s3)
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Count", async () => {
        const query = /* GraphQL */ `
            {
                ${Actor.plural} {
                    actedInAggregate {
                        count
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[Actor.plural][0][`actedInAggregate`]).toEqual({
            count: 4,
        });

        expect((gqlResult as any).data[Actor.plural]).toIncludeSameMembers([
            {
                actedInAggregate: {
                    count: 4,
                },
            },
            {
                actedInAggregate: {
                    count: 4,
                },
            },
        ]);
    });

    test("Min", async () => {
        const query = /* GraphQL */ `
            {
                ${Actor.plural} {
                    actedInAggregate {
                        node {
                            cost {
                                min
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult as any).data[Actor.plural]).toIncludeSameMembers([
            {
                actedInAggregate: {
                    node: {
                        cost: {
                            min: 10000000,
                        },
                    },
                },
            },
            {
                actedInAggregate: {
                    node: {
                        cost: {
                            min: 12000000,
                        },
                    },
                },
            },
        ]);
    });

    test("Max", async () => {
        const query = /* GraphQL */ `
            {
                ${Actor.plural} {
                    actedInAggregate {
                        node {
                            cost {
                                max
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult as any).data[Actor.plural]).toIncludeSameMembers([
            {
                actedInAggregate: {
                    node: {
                        cost: {
                            max: 20000000,
                        },
                    },
                },
            },
            {
                actedInAggregate: {
                    node: {
                        cost: {
                            max: 20000000,
                        },
                    },
                },
            },
        ]);
    });

    test("Sum", async () => {
        const query = /* GraphQL */ `
            {
                ${Actor.plural} {
                    actedInAggregate {
                        node {
                            cost {
                                sum
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult as any).data[Actor.plural]).toIncludeSameMembers([
            {
                actedInAggregate: {
                    node: {
                        cost: {
                            sum: 52000000,
                        },
                    },
                },
            },
            {
                actedInAggregate: {
                    node: {
                        cost: {
                            sum: 72000000,
                        },
                    },
                },
            },
        ]);
    });

    test("Multiple aggregations", async () => {
        const query = /* GraphQL */ `
            {
                ${Actor.plural} {
                    actedInAggregate {
                        count
                        node {
                            cost {
                                min
                                max
                                average
                                sum
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult as any).data[Actor.plural]).toIncludeSameMembers([
            {
                actedInAggregate: {
                    count: 4,
                    node: {
                        cost: {
                            average: 13000000,
                            max: 20000000,
                            min: 10000000,
                            sum: 52000000,
                        },
                    },
                },
            },
            {
                actedInAggregate: {
                    count: 4,
                    node: {
                        cost: {
                            average: 18000000,
                            max: 20000000,
                            min: 12000000,
                            sum: 72000000,
                        },
                    },
                },
            },
        ]);
    });

    // Edge aggregation
    test("Edge Count", async () => {
        const query = /* GraphQL */ `
            {
                ${Actor.plural} {
                    actedInAggregate {
                        count
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult as any).data[Actor.plural]).toIncludeSameMembers([
            {
                actedInAggregate: {
                    count: 4,
                },
            },
            {
                actedInAggregate: {
                    count: 4,
                },
            },
        ]);
    });

    test("Edge screenTime", async () => {
        const query = /* GraphQL */ `
            {
                ${Actor.plural} {
                    actedInAggregate {
                        edge {
                            screenTime {
                                sum
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult as any).data[Actor.plural]).toIncludeSameMembers([
            {
                actedInAggregate: {
                    edge: {
                        screenTime: {
                            sum: 224,
                        },
                    },
                },
            },
            {
                actedInAggregate: {
                    edge: {
                        screenTime: {
                            sum: 1784,
                        },
                    },
                },
            },
        ]);
    });
});

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

describe("Field Level Aggregations", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let typeMovie: UniqueType;
    let typeActor: UniqueType;

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");

        typeDefs = `
        type ${typeMovie.name} {
            title: String
            ${typeActor.plural}: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties:"ActedIn")
        }

        type ${typeActor.name} {
            name: String
            age: Int
            born: DateTime
            ${typeMovie.plural}: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT, properties:"ActedIn")
        }

        type ActedIn @relationshipProperties {
            screentime: Int
            character: String
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (m:${typeMovie.name} { title: "Terminator"})
            CREATE(m)<-[:ACTED_IN { screentime: 60, character: "Terminator" }]-(:${typeActor.name} { name: "Arnold", age: 54, born: datetime('1980-07-02')})
            CREATE (m)<-[:ACTED_IN { screentime: 120, character: "Sarah" }]-(:${typeActor.name} {name: "Linda", age:37, born: datetime('2000-02-02')})
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("count nodes", async () => {
        const query = `
            query {
              ${typeMovie.plural} {
                ${typeActor.plural}Aggregate {
                  count
                }
              }
            }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
            count: 2,
        });
    });

    describe("node aggregation", () => {
        test("shortest and longest node string", async () => {
            const query = `
            query {
                ${typeMovie.plural} {
                    ${typeActor.plural}Aggregate {
                        node {
                            name {
                                longest
                                shortest
                            }
                        }
                    }
                }
            }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
                node: {
                    name: {
                        longest: "Arnold",
                        shortest: "Linda",
                    },
                },
            });
        });

        test("max, min, sum and avg integers", async () => {
            const query = `
            query {
                ${typeMovie.plural} {
                    ${typeActor.plural}Aggregate {
                        node {
                            age {
                                max
                                min
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
            expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
                node: {
                    age: {
                        max: 54,
                        min: 37,
                        average: 45.5,
                        sum: 91,
                    },
                },
            });
        });

        test("max and min in datetime", async () => {
            const query = `
            query {
                ${typeMovie.plural} {
                    ${typeActor.plural}Aggregate {
                        node {
                            born {
                                max
                                min
                            }
                        }
                    }
                }
            }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
                node: {
                    born: {
                        max: "2000-02-02T00:00:00.000Z",
                        min: "1980-07-02T00:00:00.000Z",
                    },
                },
            });
        });
    });

    describe("edge aggregations", () => {
        test("max, min and avg integers", async () => {
            const query = `
            query {
                ${typeMovie.plural} {
                    ${typeActor.plural}Aggregate {
                        edge {
                            screentime {
                                max
                                min
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
            expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
                edge: {
                    screentime: {
                        max: 120,
                        min: 60,
                        average: 90,
                        sum: 180,
                    },
                },
            });
        });

        test("longest and shortest strings", async () => {
            const query = `
            query {
                ${typeMovie.plural} {
                    ${typeActor.plural}Aggregate {
                        edge {
                            character {
                                longest,
                                shortest
                            }
                        }
                    }
                }
            }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
                edge: {
                    character: {
                        longest: "Terminator",
                        shortest: "Sarah",
                    },
                },
            });
        });
    });
});

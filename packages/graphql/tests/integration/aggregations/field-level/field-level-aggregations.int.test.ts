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

import { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { generateUniqueType } from "../../../../src/utils/test/graphql-types";

describe("aggregations-field-level-basic", () => {
    let driver: Driver;
    let session: Session;
    let typeDefs: string;

    const typeMovie = generateUniqueType("Movie");
    const typeActor = generateUniqueType("Actor");

    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();

        typeDefs = `
        type ${typeMovie.name} {
            title: String
            ${typeActor.plural}: [${typeActor.name}] @relationship(type: "ACTED_IN", direction: IN, properties:"ActedIn")
        }

        type ${typeActor.name} {
            name: String
            age: Int
            ${typeMovie.plural}: [${typeMovie.name}] @relationship(type: "ACTED_IN", direction: OUT, properties:"ActedIn")
        }

        interface ActedIn {
            screentime: Int
            character: String
        }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
        session = driver.session();
        await session.run(`CREATE (m:${typeMovie.name} { title: "Terminator"})<-[:ACTED_IN { screentime: 60, character: "Terminator" }]-(:${typeActor.name} { name: "Arnold", age: 54})
        CREATE (m)<-[:ACTED_IN { screentime: 120, character: "Sarah" }]-(:${typeActor.name} {name: "Linda", age:37})`);
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
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

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });

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

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

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

        test("max, min and avg integers", async () => {
            const query = `
            query {
                ${typeMovie.plural} {
                    ${typeActor.plural}Aggregate {
                        node {
                            age {
                                max
                                min
                                average
                            }
                        }
                    }
                }
            }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
                node: {
                    age: {
                        max: 54,
                        min: 37,
                        average: 45.5,
                    },
                },
            });
        });
    });

    describe("Edge aggregations", () => {
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
                            }
                        }
                    }
                }
            }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
                edge: {
                    screentime: {
                        max: 120,
                        min: 60,
                        average: 90,
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

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

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

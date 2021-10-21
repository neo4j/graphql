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
import neo4j from "../../../neo4j";
import { Neo4jGraphQL } from "../../../../../src/classes";
import { generateUniqueType } from "../../../../../src/utils/test/graphql-types";

describe("Field Level Aggregations Where", () => {
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
            born: DateTime
            ${typeMovie.plural}: [${typeMovie.name}] @relationship(type: "ACTED_IN", direction: OUT, properties:"ActedIn")
        }

        interface ActedIn {
            screentime: Int
            character: String
        }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
        session = driver.session();
        await session.run(`CREATE (m:${typeMovie.name} { title: "Terminator"})<-[:ACTED_IN { screentime: 60, character: "Terminator" }]-(:${typeActor.name} { name: "Arnold", age: 54, born: datetime('1980-07-02')})
        CREATE (m)<-[:ACTED_IN { screentime: 120, character: "Sarah" }]-(:${typeActor.name} {name: "Linda", age:37, born: datetime('2000-02-02')})`);
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    test("Count nodes where string equals", async () => {
        const query = `
            query {
              ${typeMovie.plural} {
                ${typeActor.plural}Aggregate(where: {name: "Linda"}) {
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
            count: 1,
        });
    });

    test("Count nodes with OR query", async () => {
        const query = `
            query {
              ${typeMovie.plural} {
                ${typeActor.plural}Aggregate(where: {OR: [{name: "Linda"}, {name: "Arnold"}]}) {
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

    test("Count nodes with nested aggregation", async () => {
        const query = `
            query {
              ${typeMovie.plural} {
                ${typeActor.plural}Aggregate(where: {${typeMovie.plural}Aggregate: {count:1}}) {
                  count
                }
              }
          }`;
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

    describe("Using connections in where", () => {
        test("Count nodes with where in connection node", async () => {
            const query = `
            query {
                ${typeActor.plural} {
                    ${typeMovie.plural}Aggregate(where:{${typeActor.plural}Connection: {node: {name: "Linda"}}}){
                        count
                    }
                }
            }`;
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult as any).data[typeActor.plural][0][`${typeMovie.plural}Aggregate`]).toEqual({
                count: 1,
            });
        });

        test("Count nodes with where in connection edge", async () => {
            const query = `
            query {
                ${typeActor.plural} {
                    ${typeMovie.plural}Aggregate(where:{${typeActor.plural}Connection: {edge: {screentime_GT: 10}}}){
                        count
                    }
                }
            }`;
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult as any).data[typeActor.plural][0][`${typeMovie.plural}Aggregate`]).toEqual({
                count: 1,
            });
        });

        test("Count nodes with where in connection node using OR", async () => {
            const query = `
            query {
                ${typeActor.plural} {
                    ${typeMovie.plural}Aggregate(where:{${typeActor.plural}Connection: {node: {OR: [{name: "Linda"},{name: "Arnold"}]}}}){
                        count
                    }
                }
            }`;
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult as any).data[typeActor.plural][0][`${typeMovie.plural}Aggregate`]).toEqual({
                count: 1,
            });
        });
    });

    test("Count nodes with where using IN strings", async () => {
        const query = `
            query {
              ${typeMovie.plural} {
                ${typeActor.plural}Aggregate(where: {name_IN: ["Linda", "Arnold"]}) {
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

    test("Count nodes with where using IN ints", async () => {
        const query = `
            query {
              ${typeMovie.plural} {
                ${typeActor.plural}Aggregate(where: {age_IN: [40, 60, 37]}) {
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
            count: 1,
        });
    });
});

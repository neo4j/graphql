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
import { generateUniqueType } from "../../../../utils/graphql-types";

describe("Field Level Aggregations Where", () => {
    let driver: Driver;
    let session: Session;
    let typeDefs: string;

    const typeMovie = generateUniqueType("Movie");
    const typePerson = generateUniqueType("Person");

    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();

        typeDefs = `
        type ${typeMovie.name} {
            title: String
            actors: [${typePerson.name}] @relationship(type: "ACTED_IN", direction: IN, properties:"ActedIn")
        }

        type ${typePerson.name} {
            name: String
            age: Int
            born: DateTime
            movies: [${typeMovie.name}] @relationship(type: "ACTED_IN", direction: OUT, properties:"ActedIn")
        }

        interface ActedIn {
            screentime: Int
            character: String
        }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
        session = driver.session();
        await session.run(`
            CREATE (m:${typeMovie.name} { title: "Terminator"})<-[:ACTED_IN { screentime: 60, character: "Terminator" }]-(:${typePerson.name} { name: "Arnold", age: 54, born: datetime('1980-07-02')})
            CREATE (m)<-[:ACTED_IN { screentime: 120, character: "Sarah" }]-(:${typePerson.name} {name: "Linda", age:37, born: datetime('2000-02-02')})`);
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    test("Count nodes where string equals", async () => {
        const query = `
            query {
              ${typeMovie.plural} {
                actorsAggregate(where: {name: "Linda"}) {
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
        expect((gqlResult as any).data[typeMovie.plural][0].actorsAggregate).toEqual({
            count: 1,
        });
    });

    test("Count nodes with OR query", async () => {
        const query = `
            query {
              ${typeMovie.plural} {
                actorsAggregate(where: {OR: [{name: "Linda"}, {name: "Arnold"}]}) {
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
        expect((gqlResult as any).data[typeMovie.plural][0].actorsAggregate).toEqual({
            count: 2,
        });
    });

    test("Count nodes with nested aggregation", async () => {
        const query = `
            query {
              ${typeMovie.plural} {
                actorsAggregate(where: {moviesAggregate: {count:1}}) {
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
        expect((gqlResult as any).data[typeMovie.plural][0].actorsAggregate).toEqual({
            count: 2,
        });
    });

    describe("Using connections in where", () => {
        test("Count nodes with where in connection node", async () => {
            const query = `
            query {
                ${typePerson.plural} {
                    moviesAggregate(where:{actorsConnection: {node: {name: "Linda"}}}){
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
            expect((gqlResult as any).data[typePerson.plural][0].moviesAggregate).toEqual({
                count: 1,
            });
        });

        test("Count nodes with where in connection edge", async () => {
            const query = `
            query {
                ${typePerson.plural} {
                    moviesAggregate(where:{actorsConnection: {edge: {screentime_GT: 10}}}){
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
            expect((gqlResult as any).data[typePerson.plural][0].moviesAggregate).toEqual({
                count: 1,
            });
        });

        test("Count nodes with where in connection node using OR", async () => {
            const query = `
            query {
                ${typePerson.plural} {
                    moviesAggregate(where:{actorsConnection: {node: {OR: [{name: "Linda"},{name: "Arnold"}]}}}){
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
            expect((gqlResult as any).data[typePerson.plural][0].moviesAggregate).toEqual({
                count: 1,
            });
        });
    });

    test("Count nodes with where using IN strings", async () => {
        const query = `
            query {
              ${typeMovie.plural} {
                actorsAggregate(where: {name_IN: ["Linda", "Arnold"]}) {
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
        expect((gqlResult as any).data[typeMovie.plural][0].actorsAggregate).toEqual({
            count: 2,
        });
    });

    test("Count nodes with where using IN ints", async () => {
        const query = `
            query {
              ${typeMovie.plural} {
                actorsAggregate(where: {age_IN: [40, 60, 37]}) {
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
        expect((gqlResult as any).data[typeMovie.plural][0].actorsAggregate).toEqual({
            count: 1,
        });
    });

    test("Count nodes with datetime filter", async () => {
        const query = `
            query {
              ${typeMovie.plural} {
                actorsAggregate(where: {born_GT: "2000-01-01"}) {
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
        expect((gqlResult as any).data[typeMovie.plural][0].actorsAggregate).toEqual({
            count: 1,
        });
    });
});

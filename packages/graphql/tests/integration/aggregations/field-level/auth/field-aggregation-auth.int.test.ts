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
import { IncomingMessage } from "http";
import neo4j from "../../../neo4j";
import { Neo4jGraphQL } from "../../../../../src/classes";
import { generateUniqueType } from "../../../../../tests/utils/graphql-types";
import { createJwtRequest } from "../../../../utils/create-jwt-request";

describe("Field Level Aggregations Auth", () => {
    let driver: Driver;
    let session: Session;
    const typeMovie = generateUniqueType("Movie");
    const typeActor = generateUniqueType("Actor");
    const typeDefs = `
    type ${typeMovie.name} {
        name: String
        year: Int
        createdAt: DateTime
        testId: Int
        ${typeActor.plural}: [${typeActor.name}] @relationship(type: "ACTED_IN", direction: IN)
    }

    type ${typeActor.name} {
        name: String
        year: Int
        createdAt: DateTime
        ${typeMovie.plural}: [${typeMovie.name}] @relationship(type: "ACTED_IN", direction: OUT)
    }`;
    const secret = "secret";

    beforeAll(async () => {
        driver = await neo4j();
        session = driver.session();

        await session.run(`
        CREATE (m:${typeMovie.name}
            {name: "Terminator",testId: 1234,year:1990,createdAt: datetime()})
            <-[:ACTED_IN]-
            (:${typeActor.name} { name: "Arnold", year: 1970, createdAt: datetime()})

        CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", year:1985, createdAt: datetime()})`);
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    const testCases = [
        { name: "count", query: "count" },
        { name: "string", query: `node {name {longest, shortest}}` },
        { name: "number", query: `node {year {max, min, average}}` },
        { name: "default", query: `node { createdAt {max, min}}` },
    ];

    testCases.forEach((testCase) => {
        describe(`isAuthenticated auth requests ~ ${testCase.name}`, () => {
            let req: IncomingMessage;
            let neoSchema: Neo4jGraphQL;

            beforeAll(() => {
                const extendedTypeDefs = `${typeDefs}
                extend type ${typeMovie.name} @auth(rules: [{ isAuthenticated: true }])`;

                neoSchema = new Neo4jGraphQL({
                    typeDefs: extendedTypeDefs,
                    config: {
                        jwt: {
                            secret,
                        },
                    },
                });

                req = createJwtRequest(secret);
            });

            test("accepts authenticated requests to movie -> actorAggregate", async () => {
                const query = `query {
                ${typeMovie.plural} {
                    ${typeActor.plural}Aggregate {
                        count
                        }
                    }
                }`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });
                expect(gqlResult.errors).toBeUndefined();
            });

            test("accepts authenticated requests to actor -> movieAggregate", async () => {
                const query = `query {
                ${typeActor.plural} {
                    ${typeMovie.plural}Aggregate {
                        ${testCase.query}
                        }
                    }
                }`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });
                expect(gqlResult.errors).toBeUndefined();
            });

            test("rejects unauthenticated requests to movie -> actorAggregate", async () => {
                const query = `query {
                ${typeMovie.plural} {
                    ${typeActor.plural}Aggregate {
                        ${testCase.query}
                        }
                    }
                }`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });
                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            });

            test("rejects unauthenticated requests to actor -> movieAggregate", async () => {
                const query = `query {
                ${typeActor.plural} {
                    ${typeMovie.plural}Aggregate {
                        ${testCase.query}
                        }
                    }
                }`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });
                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            });
        });
        describe(`allow requests ~ ${testCase.name}`, () => {
            let neoSchema: Neo4jGraphQL;

            beforeAll(() => {
                const extendedTypeDefs = `${typeDefs}
                extend type ${typeMovie.name} @auth(rules: [{
                    allow: { testId: "$jwt.sub" }
                }])`;

                neoSchema = new Neo4jGraphQL({
                    typeDefs: extendedTypeDefs,
                    config: {
                        jwt: {
                            secret,
                        },
                    },
                });
            });

            test("authenticated query", async () => {
                const query = `query {
                    ${typeActor.plural} {
                        ${typeMovie.plural}Aggregate {
                            ${testCase.query}
                            }
                        }
                    }`;

                const req = createJwtRequest(secret, { sub: 1234 });
                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });
                expect(gqlResult.errors).toBeUndefined();
            });

            test("unauthenticated query", async () => {
                const query = `query {
                    ${typeActor.plural} {
                        ${typeMovie.plural}Aggregate {
                            ${testCase.query}
                            }
                        }
                    }`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });
                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            });

            test("authenticated query with wrong credentials", async () => {
                const query = `query {
                    ${typeActor.plural} {
                        ${typeMovie.plural}Aggregate {
                            ${testCase.query}
                            }
                        }
                    }`;
                const invalidReq = createJwtRequest(secret, { sub: 2222 });

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, req: invalidReq, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });
                expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
            });
        });
    });
});

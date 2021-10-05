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
import jsonwebtoken from "jsonwebtoken";
import { IncomingMessage } from "http";
import { Socket } from "net";
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { generateUniqueType } from "../../../../src/utils/test/graphql-types";

describe("aggregations-field-level-basic", () => {
    let driver: Driver;
    let session: Session;
    const testCases = ["count", `node {name {longest, shortest}}`];
    const typeMovie = generateUniqueType("Movie");
    const typeActor = generateUniqueType("Actor");
    const typeDefs = `
    type ${typeMovie.name} @auth(rules: [{ isAuthenticated: true }]){
        name: String
        ${typeActor.plural}: [${typeActor.name}] @relationship(type: "ACTED_IN", direction: IN)
    }

    type ${typeActor.name} {
        name: String
        age: Int
        ${typeMovie.plural}: [${typeMovie.name}] @relationship(type: "ACTED_IN", direction: OUT)
    }`;
    const secret = "secret";
    let token: string;
    let invalidToken: string;

    beforeAll(async () => {
        driver = await neo4j();
        session = driver.session();

        token = jsonwebtoken.sign(
            {
                roles: [],
                sub: 1234,
            },
            secret
        );

        invalidToken = jsonwebtoken.sign(
            {
                roles: [],
                sub: 2222,
            },
            secret
        );
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    testCases.forEach((testCase) => {
        describe(`isAuthenticated auth requests ~ ${testCase}`, () => {
            let req: IncomingMessage;
            let neoSchema: Neo4jGraphQL;

            beforeAll(async () => {
                neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    config: {
                        jwt: {
                            secret,
                        },
                    },
                });

                const socket = new Socket({ readable: true });
                req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${invalidToken}`;
                await session.run(`CREATE (m:${typeMovie.name} { name: "Terminator"})<-[:ACTED_IN]-(:${typeActor.name} { name: "Arnold", age: 54})
                CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", age:37})`);
            });

            it("accepts authenticated requests to movie -> actorAggregate", async () => {
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

            it("accepts authenticated requests to actor -> movieAggregate", async () => {
                const query = `query {
                ${typeActor.plural} {
                    ${typeMovie.plural}Aggregate {
                        ${testCase}
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

            it("rejects unauthenticated requests to movie -> actorAggregate", async () => {
                const query = `query {
                ${typeMovie.plural} {
                    ${typeActor.plural}Aggregate {
                        ${testCase}
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

            it("rejects unauthenticated requests to actor -> movieAggregate", async () => {
                const query = `query {
                ${typeActor.plural} {
                    ${typeMovie.plural}Aggregate {
                        ${testCase}
                        }
                    }
                }`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });
                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
                await session.run(`CREATE (m:${typeMovie.name} { name: "Terminator"})<-[:ACTED_IN]-(:${typeActor.name} { name: "Arnold", age: 54})
                CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", age:37})`);
            });
        });

        describe(`allow requests ~ ${testCase}`, () => {
            let req: IncomingMessage;
            let neoSchema: Neo4jGraphQL;

            const extendedTypeDefs = `${typeDefs}

            extend type ${typeMovie.name} @auth(rules: [{ allow: { testId: "$jwt.sub" }}])`;

            beforeAll(async () => {
                neoSchema = new Neo4jGraphQL({
                    typeDefs: extendedTypeDefs,
                    config: {
                        jwt: {
                            secret,
                        },
                    },
                });

                const socket = new Socket({ readable: true });
                req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                await session.run(`
                CREATE (m:${typeMovie.name} { name: "Terminator", testId: 1234})<-[:ACTED_IN]-(:${typeActor.name} { name: "Arnold", age: 54})
                CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", age:37})`);
            });

            it("authenticated query", async () => {
                const query = `query {
                    ${typeActor.plural} {
                        ${typeMovie.plural}Aggregate {
                            ${testCase}
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

            it("unauthenticated query", async () => {
                const query = `query {
                    ${typeActor.plural} {
                        ${typeMovie.plural}Aggregate {
                            ${testCase}
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

            it("authenticated query with wrong credentials", async () => {
                const query = `query {
                    ${typeActor.plural} {
                        ${typeMovie.plural}Aggregate {
                            ${testCase}
                            }
                        }
                    }`;
                const socket = new Socket({ readable: true });
                const invalidReq = new IncomingMessage(socket);
                invalidReq.headers.authorization = `Bearer ${invalidToken}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver, invalidReq, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });
                expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            });
        });
    });
});

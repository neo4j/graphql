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

    beforeAll(async () => {
        driver = await neo4j();
        session = driver.session();
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    describe("authenticated requests", () => {
        let req: IncomingMessage;
        let token: string;
        let neoSchema: Neo4jGraphQL;

        const typeMovie = generateUniqueType("Movie");
        const typeActor = generateUniqueType("Actor");
        const typeDefs = `
        type ${typeMovie.name} @auth(rules: [{ isAuthenticated: true }]){
            title: String
            ${typeActor.plural}: [${typeActor.name}] @relationship(type: "ACTED_IN", direction: IN)
        }

        type ${typeActor.name} {
            name: String
            age: Int
            ${typeMovie.plural}: [${typeMovie.name}] @relationship(type: "ACTED_IN", direction: OUT)
        }`;

        beforeAll(async () => {
            const secret = "secret";

            token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: "invalid",
                },
                secret
            );

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
            req.headers.authorization = `Bearer ${token}`;
            await session.run(`CREATE (m:${typeMovie.name} { title: "Terminator"})<-[:ACTED_IN]-(:${typeActor.name} { name: "Arnold", age: 54})
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
            expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
                count: 2,
            });
        });

        it("accepts authenticated requests to actor -> movieAggregate", async () => {
            const query = `query {
            ${typeActor.plural} {
                ${typeMovie.plural}Aggregate {
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
            expect((gqlResult as any).data[typeActor.plural][0][`${typeMovie.plural}Aggregate`]).toEqual({
                count: 1,
            });
        });
    });

    describe("unauthenticated requests", () => {
        let neoSchema: Neo4jGraphQL;

        const typeMovie = generateUniqueType("Movie");
        const typeActor = generateUniqueType("Actor");
        const typeDefs = `
        type ${typeMovie.name} @auth(rules: [{ isAuthenticated: true }]){
            title: String
            ${typeActor.plural}: [${typeActor.name}] @relationship(type: "ACTED_IN", direction: IN)
        }

        type ${typeActor.name} {
            name: String
            age: Int
            ${typeMovie.plural}: [${typeMovie.name}] @relationship(type: "ACTED_IN", direction: OUT)
        }`;

        beforeAll(async () => {
            const secret = "secret";

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                config: {
                    jwt: {
                        secret,
                    },
                },
            });
            await session.run(`CREATE (m:${typeMovie.name} { title: "Terminator"})<-[:ACTED_IN]-(:${typeActor.name} { name: "Arnold", age: 54})
            CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", age:37})`);
        });

        it("rejects unauthenticated requests to movie -> actorAggregate", async () => {
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
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });
            expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
        });

        it("rejects unauthenticated requests to actor -> movieAggregate", async () => {
            const query = `query {
            ${typeActor.plural} {
                ${typeMovie.plural}Aggregate {
                    count
                    }
                }
            }`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });
            expect((gqlResult.errors as any[])[0].message).toEqual("Unauthenticated");
            await session.run(`CREATE (m:${typeMovie.name} { title: "Terminator"})<-[:ACTED_IN]-(:${typeActor.name} { name: "Arnold", age: 54})
            CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", age:37})`);
        });
    });

    describe("authenticated with allow requests", () => {
        let req: IncomingMessage;
        let token: string;
        let neoSchema: Neo4jGraphQL;

        const typeMovie = generateUniqueType("Movie");
        const typeActor = generateUniqueType("Actor");
        const typeDefs = `
        type ${typeMovie.name} @auth(rules: [{ allow: { testId: "$jwt.sub" }}]){
            testId: Int!
            title: String
            ${typeActor.plural}: [${typeActor.name}] @relationship(type: "ACTED_IN", direction: IN)
        }

        type ${typeActor.name} {
            name: String
            age: Int
            ${typeMovie.plural}: [${typeMovie.name}] @relationship(type: "ACTED_IN", direction: OUT)
        }
        `;

        beforeAll(async () => {
            const secret = "secret";

            token = jsonwebtoken.sign(
                {
                    roles: [],
                    sub: 1234,
                },
                secret
            );

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
            req.headers.authorization = `Bearer ${token}`;

            await session.run(`
            CREATE (m:${typeMovie.name} { title: "Terminator", testId: 1234})<-[:ACTED_IN]-(:${typeActor.name} { name: "Arnold", age: 54})
            CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", age:37})`);
        });

        it("authenticated query", async () => {
            const query = `query {
            ${typeActor.plural} {
                ${typeMovie.plural}Aggregate {
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
            expect((gqlResult as any).data[typeActor.plural][0][`${typeMovie.plural}Aggregate`]).toEqual({
                count: 1,
            });
        });
    });
});

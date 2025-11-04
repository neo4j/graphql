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

import supertest from "supertest";
import { UniqueType } from "../../utils/graphql-types";
import { GatewayServer } from "./setup/gateway-server";
import { Neo4j } from "./setup/neo4j";
import type { Server } from "./setup/server";
import { TestSubgraph } from "./setup/subgraph";
import { SubgraphServer } from "./setup/subgraph-server";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("Federation 2 Authorization", () => {
    describe("type authorization", () => {
        let usersServer: Server;
        let reviewsServer: Server;
        let gatewayServer: Server;

        let neo4j: Neo4j;

        let gatewayUrl: string;

        let User: UniqueType;
        let Review: UniqueType;

        beforeAll(async () => {
            User = new UniqueType("User");
            Review = new UniqueType("Review");

            const users = `
                extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])
    
                type ${User} @authorization(validate: [{ where: { node: { id: "$jwt.sub" } } }]) @key(fields: "id") @shareable {
                    id: ID!
                    name: String
                    password: String 
                }
            `;

            const reviews = `
                extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])
    
                type ${User} @key(fields: "id", resolvable: false) @shareable {
                    id: ID!
                }
    
                type ${Review} {
                    score: Int!
                    description: String!
                    author: ${User}! @relationship(type: "AUTHORED", direction: IN)
                }
            `;

            neo4j = new Neo4j();
            await neo4j.init();

            const usersSubgraph = new TestSubgraph({ typeDefs: users, driver: neo4j.driver });
            const reviewsSubgraph = new TestSubgraph({ typeDefs: reviews, driver: neo4j.driver });

            const [productsSchema, reviewsSchema] = await Promise.all([
                usersSubgraph.getSchema(),
                reviewsSubgraph.getSchema(),
            ]);

            usersServer = new SubgraphServer(productsSchema);
            reviewsServer = new SubgraphServer(reviewsSchema);

            const [productsUrl, reviewsUrl] = await Promise.all([usersServer.start(), reviewsServer.start()]);

            gatewayServer = new GatewayServer([
                { name: "products", url: productsUrl },
                { name: "reviews", url: reviewsUrl },
            ]);

            gatewayUrl = await gatewayServer.start();

            await neo4j.executeWrite(
                `CREATE (:${User} { id: "1", name: "user", password: "password" })-[:AUTHORED]->(:${Review} { score: 5, description: "review" })`
            );
        });

        afterAll(async () => {
            await gatewayServer.stop();
            await Promise.all([usersServer.stop(), reviewsServer.stop()]);
            await neo4j.close();
        });

        test("should throw when protected type is queried as unauthorized user", async () => {
            const request = supertest(gatewayUrl);

            const response = await request
                .post("")
                .set({ Authorization: createBearerToken("secret", { sub: "baduser" }) })
                .send({
                    query: `
                {
                    ${Review.plural} {
                      description
                      score
                      author {
                        id
                        name
                        password
                      }
                    }
                  }
            `,
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual({
                [Review.plural]: [{ description: "review", score: 5, author: { id: "1", name: null, password: null } }],
            });
            expect(response.body.errors[0].message).toBe("Forbidden");
        });

        test("should resolve when protected type is queried as authorized user", async () => {
            const request = supertest(gatewayUrl);

            const response = await request
                .post("")
                .set({ authorization: createBearerToken("secret", { sub: "1" }) })
                .send({
                    query: `
                {
                    ${Review.plural} {
                      description
                      score
                      author {
                        id
                        name
                        password
                      }
                    }
                  }
            `,
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual({
                [Review.plural]: [
                    { description: "review", score: 5, author: { id: "1", name: "user", password: "password" } },
                ],
            });
            expect(response.body.errors).toBeUndefined();
        });
    });

    describe("field authorization", () => {
        let usersServer: Server;
        let reviewsServer: Server;
        let gatewayServer: Server;

        let neo4j: Neo4j;

        let gatewayUrl: string;

        let User: UniqueType;
        let Review: UniqueType;

        beforeAll(async () => {
            User = new UniqueType("User");
            Review = new UniqueType("Review");

            const users = `
                extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])
    
                type ${User} @key(fields: "id") @shareable {
                    id: ID!
                    name: String
                    password: String @authorization(validate: [{ where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            const reviews = `
                extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])
    
                type ${User} @key(fields: "id", resolvable: false) @shareable {
                    id: ID!
                }
    
                type ${Review} {
                    score: Int!
                    description: String!
                    author: ${User}! @relationship(type: "AUTHORED", direction: IN)
                }
            `;

            neo4j = new Neo4j();
            await neo4j.init();

            const usersSubgraph = new TestSubgraph({ typeDefs: users, driver: neo4j.driver });
            const reviewsSubgraph = new TestSubgraph({ typeDefs: reviews, driver: neo4j.driver });

            const [productsSchema, reviewsSchema] = await Promise.all([
                usersSubgraph.getSchema(),
                reviewsSubgraph.getSchema(),
            ]);

            usersServer = new SubgraphServer(productsSchema);
            reviewsServer = new SubgraphServer(reviewsSchema);

            const [productsUrl, reviewsUrl] = await Promise.all([usersServer.start(), reviewsServer.start()]);

            gatewayServer = new GatewayServer([
                { name: "products", url: productsUrl },
                { name: "reviews", url: reviewsUrl },
            ]);

            gatewayUrl = await gatewayServer.start();

            await neo4j.executeWrite(
                `CREATE (:${User} { id: "1", name: "user", password: "password" })-[:AUTHORED]->(:${Review} { score: 5, description: "review" })`
            );
        });

        afterAll(async () => {
            await gatewayServer.stop();
            await Promise.all([usersServer.stop(), reviewsServer.stop()]);
            await neo4j.close();
        });

        test("should resolve when protected field is not queried", async () => {
            const request = supertest(gatewayUrl);

            const response = await request
                .post("")
                .set({ Authorization: createBearerToken("secret", { sub: "baduser" }) })
                .send({
                    query: `
                {
                    ${Review.plural} {
                      description
                      score
                      author {
                        id
                        name
                      }
                    }
                  }
            `,
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                data: {
                    [Review.plural]: [{ description: "review", score: 5, author: { id: "1", name: "user" } }],
                },
            });
        });

        test("should throw when protected field is queried as unauthorized user", async () => {
            const request = supertest(gatewayUrl);

            const response = await request
                .post("")
                .set({ Authorization: createBearerToken("secret", { sub: "baduser" }) })
                .send({
                    query: `
                {
                    ${Review.plural} {
                      description
                      score
                      author {
                        id
                        name
                        password
                      }
                    }
                  }
            `,
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual({
                [Review.plural]: [{ description: "review", score: 5, author: { id: "1", name: null, password: null } }],
            });
            expect(response.body.errors[0].message).toBe("Forbidden");
        });

        test("should resolve when protected field is queried as authorized user", async () => {
            const request = supertest(gatewayUrl);

            const response = await request
                .post("")
                .set({ authorization: createBearerToken("secret", { sub: "1" }) })
                .send({
                    query: `
                {
                    ${Review.plural} {
                      description
                      score
                      author {
                        id
                        name
                        password
                      }
                    }
                  }
            `,
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual({
                [Review.plural]: [
                    { description: "review", score: 5, author: { id: "1", name: "user", password: "password" } },
                ],
            });
            expect(response.body.errors).toBeUndefined();
        });
    });
});

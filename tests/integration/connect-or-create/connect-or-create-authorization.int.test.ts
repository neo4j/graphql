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

import { type Integer } from "neo4j-driver";
import { createBearerToken } from "../../utils/create-bearer-token";
import { TestHelper } from "../../utils/tests-helper";

describe("connectOrCreate", () => {
    describe("Update -> ConnectOrCreate", () => {
        const testHelper = new TestHelper();
        let typeDefs: string;
        let queryUpdate: string;
        let queryCreate: string;

        const typeMovie = testHelper.createUniqueType("Movie");
        const typeGenre = testHelper.createUniqueType("Genre");
        const secret = "secret";

        beforeEach(async () => {
            typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                roles: [String!]!
            }
            
            type ${typeMovie.name} {
                title: String
                genres: [${typeGenre.name}!]! @relationship(type: "IN_GENRE", direction: OUT)
            }
    
            type ${typeGenre.name} @authorization(validate: [{ operations: [CREATE_RELATIONSHIP, CREATE], where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                name: String @unique
            }
            `;

            queryUpdate = `
                mutation {
                  ${typeMovie.operations.update}(
                    update: {
                        title: "Forrest Gump 2"
                        genres: {
                          connectOrCreate: {
                            where: { node: { name: "Horror" } }
                            onCreate: { node: { name: "Horror" } }
                          }
                        }
                      }
                  ) {
                    ${typeMovie.plural} {
                      title
                    }
                  }
                }
                `;

            queryCreate = `
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: "Cool Movie"
                                genres: {
                                    connectOrCreate: {
                                        where: { node: { name: "Comedy" } },
                                        onCreate: { node: { name: "Comedy" } }
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                        }
                    }
                }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("cannot update with ConnectOrCreate auth", async () => {
            await testHelper.executeCypher(`CREATE (:${typeMovie.name} { title: "RandomMovie1"})`);
            const gqlResult = await testHelper.executeGraphQL(queryUpdate);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("update with ConnectOrCreate auth", async () => {
            await testHelper.executeCypher(`CREATE (:${typeMovie.name} { title: "Forrest Gump"})`);
            const token = createBearerToken(secret, { roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(queryUpdate, token);
            expect(gqlResult.errors).toBeUndefined();

            const genreCount: any = await testHelper.executeCypher(`
              MATCH (m:${typeGenre.name} { name: "Horror" })
              RETURN COUNT(m) as count
            `);
            expect((genreCount.records[0].toObject().count as Integer).toNumber()).toBe(1);
        });

        test("create with ConnectOrCreate auth", async () => {
            const token = createBearerToken(secret, { roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(queryCreate, token);
            expect(gqlResult.errors).toBeUndefined();

            const genreCount: any = await testHelper.executeCypher(`
              MATCH (m:${typeGenre.name} { name: "Comedy" })
              RETURN COUNT(m) as count
            `);
            expect((genreCount.records[0].toObject().count as Integer).toNumber()).toBe(1);
        });
    });

    describe("authorization rules on source and target types", () => {
        const testHelper = new TestHelper();
        let typeDefs: string;
        let queryUpdate: string;
        let queryCreate: string;

        const typeMovie = testHelper.createUniqueType("Movie");
        const typeGenre = testHelper.createUniqueType("Genre");
        const secret = "secret";

        beforeEach(async () => {
            typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                roles: [String!]!
            }
            
            type ${typeMovie.name} @authorization(validate: [{ operations: [CREATE_RELATIONSHIP, CREATE], where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                title: String
                genres: [${typeGenre.name}!]! @relationship(type: "IN_GENRE", direction: OUT)
            }
    
            type ${typeGenre.name} @authorization(validate: [{ operations: [CREATE_RELATIONSHIP, CREATE], where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                name: String @unique
            }
            `;

            queryUpdate = `
                mutation {
                  ${typeMovie.operations.update}(
                    update: {
                        title: "Forrest Gump 2"
                        genres: {
                          connectOrCreate: {
                            where: { node: { name: "Horror" } }
                            onCreate: { node: { name: "Horror" } }
                          }
                        }
                      }
                  ) {
                    ${typeMovie.plural} {
                      title
                    }
                  }
                }
                `;

            queryCreate = `
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: "Cool Movie"
                                genres: {
                                    connectOrCreate: {
                                        where: { node: { name: "Comedy" } },
                                        onCreate: { node: { name: "Comedy" } }
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                        }
                    }
                }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("cannot update with ConnectOrCreate auth", async () => {
            await testHelper.executeCypher(`CREATE (:${typeMovie.name} { title: "RandomMovie1"})`);
            const gqlResult = await testHelper.executeGraphQL(queryUpdate);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("update with ConnectOrCreate auth", async () => {
            await testHelper.executeCypher(`CREATE (:${typeMovie.name} { title: "Forrest Gump"})`);
            const token = createBearerToken(secret, { roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(queryUpdate, token);
            expect(gqlResult.errors).toBeUndefined();

            const genreCount: any = await testHelper.executeCypher(`
              MATCH (m:${typeGenre.name} { name: "Horror" })
              RETURN COUNT(m) as count
            `);
            expect((genreCount.records[0].toObject().count as Integer).toNumber()).toBe(1);
        });

        test("create with ConnectOrCreate auth", async () => {
            const token = createBearerToken(secret, { roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(queryCreate, token);
            expect(gqlResult.errors).toBeUndefined();

            const genreCount: any = await testHelper.executeCypher(`
              MATCH (m:${typeGenre.name} { name: "Comedy" })
              RETURN COUNT(m) as count
            `);
            expect((genreCount.records[0].toObject().count as Integer).toNumber()).toBe(1);
        });
    });
});

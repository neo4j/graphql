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

import { createBearerToken } from "../../../../utils/create-bearer-token";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("Field Level Aggregations Auth", () => {
    const testCases = [
        { name: "count", selection: "count" },
        { name: "string", selection: `node {name {longest, shortest}}` },
        { name: "number", selection: `node {year {max, min, average}}` },
        { name: "default", selection: `node { createdAt {max, min}}` },
    ];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    describe.each(testCases)(`isAuthenticated auth requests ~ $name`, ({ name, selection }) => {
        let token: string;
        const testHelper = new TestHelper();

        let typeMovie: UniqueType;
        let typeActor: UniqueType;
        let typeDefs: string;
        const secret = "secret";

        beforeEach(async () => {
            typeMovie = testHelper.createUniqueType("Movie");
            typeActor = testHelper.createUniqueType("Actor");
            typeDefs = `
        type ${typeMovie.name} {
            name: String
            year: Int
            createdAt: DateTime
            testId: String
            ${typeActor.plural}: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    
        type ${typeActor.name} {
            name: String
            year: Int
            createdAt: DateTime
            ${typeMovie.plural}: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
        }
        
        extend type ${typeMovie.name} @authentication(operations: [AGGREGATE])
        `;

            await testHelper.executeCypher(`
            CREATE (m:${typeMovie.name}
                {name: "Terminator",testId: "1234",year:1990,createdAt: datetime()})
                <-[:ACTED_IN]-
                (:${typeActor.name} { name: "Arnold", year: 1970, createdAt: datetime()})
    
            CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", year:1985, createdAt: datetime()})`);

            await testHelper.initNeo4jGraphQL({
                typeDefs: typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            token = createBearerToken(secret);
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("accepts authenticated requests to movie -> actorAggregate", async () => {
            const query = `query {
                ${typeMovie.plural} {
                    ${typeActor.plural}Aggregate {
                        count
                        }
                    }
                }`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
            expect(gqlResult.errors).toBeUndefined();
        });

        test("accepts authenticated requests to actor -> movieAggregate", async () => {
            const query = `query {
                ${typeActor.plural} {
                    ${typeMovie.plural}Aggregate {
                        ${selection}
                        }
                    }
                }`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
            expect(gqlResult.errors).toBeUndefined();
        });

        test("accepts unauthenticated requests to movie -> actorAggregate (only movie aggregations require authentication)", async () => {
            const query = `query {
                ${typeMovie.plural} {
                    ${typeActor.plural}Aggregate {
                        ${selection}
                        }
                    }
                }`;

            const gqlResult = await testHelper.executeGraphQL(query);
            expect(gqlResult.errors).toBeUndefined();
        });

        test("rejects unauthenticated requests to actor -> movieAggregate", async () => {
            const query = `query {
                ${typeActor.plural} {
                    ${typeMovie.plural}Aggregate {
                        ${selection}
                        }
                    }
                }`;

            const gqlResult = await testHelper.executeGraphQL(query);
            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    describe.each(testCases)(`allow requests ~ $name`, ({ name, selection }) => {
        const testHelper = new TestHelper();

        let typeMovie: UniqueType;
        let typeActor: UniqueType;
        let typeDefs: string;
        const secret = "secret";

        beforeEach(async () => {
            typeMovie = testHelper.createUniqueType("Movie");
            typeActor = testHelper.createUniqueType("Actor");
            typeDefs = `
                type ${typeMovie.name} {
                    name: String
                    year: Int
                    createdAt: DateTime
                    testId: String
                    ${typeActor.plural}: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            
                type ${typeActor.name} {
                    name: String
                    year: Int
                    createdAt: DateTime
                    ${typeMovie.plural}: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
                
                extend type ${typeMovie.name} 
                @authorization(validate: [{ operations: [AGGREGATE], when: [BEFORE], where: { node: { testId: "$jwt.sub" } } }])
                `;

            await testHelper.executeCypher(`
            CREATE (m:${typeMovie.name}
                {name: "Terminator",testId: "1234",year:1990,createdAt: datetime()})
                <-[:ACTED_IN]-
                (:${typeActor.name} { name: "Arnold", year: 1970, createdAt: datetime()})
    
            CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", year:1985, createdAt: datetime()})`);

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

        test("authenticated query", async () => {
            const query = `query {
                    ${typeActor.plural} {
                        ${typeMovie.plural}Aggregate {
                            ${selection}
                            }
                        }
                    }`;

            const token = createBearerToken(secret, { sub: "1234" });
            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
            expect(gqlResult.errors).toBeUndefined();
        });

        test("unauthenticated query", async () => {
            const query = `query {
                    ${typeActor.plural} {
                        ${typeMovie.plural}Aggregate {
                            ${selection}
                            }
                        }
                    }`;

            const gqlResult = await testHelper.executeGraphQL(query);
            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("authenticated query with wrong credentials", async () => {
            const query = `query {
                    ${typeActor.plural} {
                        ${typeMovie.plural}Aggregate {
                            ${selection}
                            }
                        }
                    }`;
            const invalidToken = createBearerToken(secret, { sub: "2222" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, invalidToken);
            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });
});

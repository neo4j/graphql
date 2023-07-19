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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../../../neo4j";
import { Neo4jGraphQL } from "../../../../../src/classes";
import { UniqueType } from "../../../../utils/graphql-types";
import { createBearerToken } from "../../../../utils/create-bearer-token";

describe("Field Level Aggregations Auth", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    const typeMovie = new UniqueType("Movie");
    const typeActor = new UniqueType("Actor");
    const typeDefs = `
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
    }`;
    const secret = "secret";

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        session = await neo4j.getSession();

        await session.run(`
        CREATE (m:${typeMovie.name}
            {name: "Terminator",testId: "1234",year:1990,createdAt: datetime()})
            <-[:ACTED_IN]-
            (:${typeActor.name} { name: "Arnold", year: 1970, createdAt: datetime()})

        CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", year:1985, createdAt: datetime()})`);
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    const testCases = [
        { name: "count", selection: "count" },
        { name: "string", selection: `node {name {longest, shortest}}` },
        { name: "number", selection: `node {year {max, min, average}}` },
        { name: "default", selection: `node { createdAt {max, min}}` },
    ];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    describe.each(testCases)(`isAuthenticated auth requests ~ $name`, ({ name, selection }) => {
        let token: string;
        let neoSchema: Neo4jGraphQL;

        beforeAll(() => {
            const extendedTypeDefs = `${typeDefs}
                extend type ${typeMovie.name} @authentication(operations: [AGGREGATE])`;

            neoSchema = new Neo4jGraphQL({
                typeDefs: extendedTypeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            token = createBearerToken(secret);
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ token }),
            });
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ token }),
            });
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });
            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    describe.each(testCases)(`allow requests ~ $name`, ({ name, selection }) => {
        let neoSchema: Neo4jGraphQL;

        beforeAll(() => {
            const extendedTypeDefs = `${typeDefs}
                extend type ${typeMovie.name} 
                    @authorization(validate: [{ operations: [AGGREGATE], when: [BEFORE], where: { node: { testId: "$jwt.sub" } } }])
                `;

            neoSchema = new Neo4jGraphQL({
                typeDefs: extendedTypeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });
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
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ token }),
            });
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({
                    token: invalidToken,
                }),
            });
            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });
});

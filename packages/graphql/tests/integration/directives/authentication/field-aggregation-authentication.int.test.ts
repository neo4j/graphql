/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Field Level Aggregations Auth", () => {
    const testCases = [
        { name: "count", selection: "count { nodes }" },
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
        type ${typeMovie.name} @node {
            name: String
            year: Int
            createdAt: DateTime
            testId: String
            actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    
        type ${typeActor.name} @node {
            name: String
            year: Int
            createdAt: DateTime
            movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
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
                    actorsConnection {
                        aggregate {
                            count {
                                nodes
                                }
                            }
                        }
                    }
                }`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
            expect(gqlResult.errors).toBeUndefined();
        });

        test("accepts authenticated requests to actor -> movieAggregate", async () => {
            const query = `query {
                ${typeActor.plural} {
                    moviesConnection {
                        aggregate {
                            ${selection}
                            }
                        }
                    }
                }`;

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
            expect(gqlResult.errors).toBeUndefined();
        });

        test("accepts unauthenticated requests to movie -> actorAggregate (only movie aggregations require authentication)", async () => {
            const query = `query {
                ${typeMovie.plural} {
                    actorsConnection {
                        aggregate {
                            ${selection}
                            }
                        }
                    }
                }`;

            const gqlResult = await testHelper.executeGraphQL(query);
            expect(gqlResult.errors).toBeUndefined();
        });

        test("rejects unauthenticated requests to actor -> movieAggregate", async () => {
            const query = `query {
                ${typeActor.plural} {
                    moviesConnection {
                        aggregate {
                            ${selection}
                            }
                        }
                    }
                }`;

            const gqlResult = await testHelper.executeGraphQL(query);
            expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
        });
    });
});

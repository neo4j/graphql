/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../../../../utils/create-bearer-token";
import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe(`Field Level Authorization Where Requests`, () => {
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
            ${typeActor.plural}: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    
        type ${typeActor.name} @node {
            name: String
            year: Int
            createdAt: DateTime
            testStr: String
            ${typeMovie.plural}: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
        }`;

        await testHelper.executeCypher(`
            CREATE (m:${typeMovie.name}
                {name: "Terminator",year:1990,createdAt: datetime()})
                <-[:ACTED_IN]-
                (:${typeActor.name} { name: "Arnold", year: 1970, createdAt: datetime(), testStr: "1234"})
                CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", year:1985, createdAt: datetime(), testStr: "1235"})`);

        const extendedTypeDefs = `${typeDefs}
        extend type ${typeActor.name} @authorization(filter: [{ operations: [AGGREGATE], where: { node: { testStr_EQ: "$jwt.sub" } } }])`;

        await testHelper.initNeo4jGraphQL({
            typeDefs: extendedTypeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("authenticated query", async () => {
        const query = `query {
            ${typeMovie.plural} {
                ${typeActor.operations.connection} {
                    aggregate {
                        count {
                            nodes
                            }
                        }
                    }
                }
            }`;

        const token = createBearerToken(secret, { sub: "1234" });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [typeMovie.plural]: [
                {
                    [typeActor.operations.connection]: {
                        aggregate: {
                            count: {
                                nodes: 1,
                            },
                        },
                    },
                },
            ],
        });
    });

    test("unauthenticated query", async () => {
        const query = `query {
            ${typeMovie.plural} {
                ${typeActor.operations.connection} {
                    aggregate {
                        count {
                            nodes
                            }
                        }
                    }
                }
            }`;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [typeMovie.plural]: [{ [typeActor.operations.connection]: { aggregate: { count: { nodes: 0 } } } }],
        });
    });

    test("authenticated query with wrong credentials", async () => {
        const query = `query {
            ${typeMovie.plural} {
                ${typeActor.operations.connection} {
                    aggregate {
                        count {
                            nodes
                            }
                        }
                    }
                }
            }`;

        const invalidToken = createBearerToken(secret, { sub: "2222" });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, invalidToken);
        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [typeMovie.plural]: [{ [typeActor.operations.connection]: { aggregate: { count: { nodes: 0 } } } }],
        });
    });
});

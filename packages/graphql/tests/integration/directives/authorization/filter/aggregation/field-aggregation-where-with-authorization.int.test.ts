/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../../../../utils/create-bearer-token";
import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe(`Field Level Authorization Where Requests`, () => {
    let token: string;
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    let typeDefs: string;

    const secret = "secret";

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");
        typeDefs = `
        type ${typeMovie.name} @node {
            name: String
            year: Int
            createdAt: DateTime
            actors: [${typeActor}!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    
        type ${typeActor} @node {
            name: String
            year: Int
            createdAt: DateTime
            testStr: String
            movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", direction: OUT)
        }`;

        await testHelper.executeCypher(`
            CREATE (m:${typeMovie}
                {name: "Terminator",year:1990,createdAt: datetime()})
                <-[:ACTED_IN]-
                (:${typeActor} { name: "Arnold", year: 1970, createdAt: datetime(), testStr: "1234"})
                CREATE (m)<-[:ACTED_IN]-(:${typeActor} {name: "Linda", year:1985, createdAt: datetime(), testStr: "1235"})`);

        const extendedTypeDefs = `${typeDefs}
        extend type ${typeActor} @authorization(filter: [{ operations: [AGGREGATE], where: { node: { testStr_EQ: "$jwt.sub" } } }])`;

        await testHelper.initNeo4jGraphQL({
            typeDefs: extendedTypeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        token = createBearerToken(secret, {
            roles: [],
            sub: "1234",
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("authenticated query", async () => {
        const query = /* GraphQL */ `
            query {
                ${typeMovie.plural} {
                    actorsConnection(where: { node: { year_GT: 10 } }) {
                        aggregate {
                            node {
                                year {
                                    max
                                }
                                name {
                                    longest
                                    shortest
                                }
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [typeMovie.plural]: [
                {
                    actorsConnection: {
                        aggregate: {
                            node: {
                                year: {
                                    max: 1970,
                                },
                                name: {
                                    longest: "Arnold",
                                    shortest: "Arnold",
                                },
                            },
                        },
                    },
                },
            ],
        });
    });
});

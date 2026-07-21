/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/7285", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    const secret = "secret";
    let Movie: UniqueType;
    let Director: UniqueType;
    let Genre: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Director = testHelper.createUniqueType("Director");
        Genre = testHelper.createUniqueType("Genre");

        typeDefs = /* GraphQL */ `
            type ${Movie}  {
                Id: ID! @id @unique
                Name: String!
                Directors: [${Director}!]! @relationship(type: "DIRECTED", direction: IN)
                Genres: [${Genre}!]! @relationship(type: "IN_GENRE", direction: OUT)
            }

            type ${Director} 
                @authorization(
                    validate: [
                        { operations: [CREATE], where: { node: { MyRoles_INCLUDES: "admin" } } }
                    ]
                ) {
                Id: ID! @id @unique
                Name: String!
                MyRoles: [String!]!
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN ['admin'] as roles
                        """
                        columnName: "roles"
                    )
                Movies: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type ${Genre}  {
                Id: ID! @id @unique
                Name: String!
                Movies: [${Movie}!]! @relationship(type: "IN_GENRE", direction: IN)
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should create a Movie with nested Director and connectOrCreate Genre", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input: [
                    {
                        Name: "A Movie"
                        Directors: { create: [{ node: { Name: "A Director" } }] }
                        Genres: {
                            connectOrCreate: [
                                {
                                    onCreate: { node: { Name: "Action" } }
                                    where: { node: { Id: "action" } }
                                }
                            ]
                        }
                    }
                ]) {
                    ${Movie.plural} {
                        Name
                        Directors {
                            Name
                        }
                        Genres {
                            Name
                        }
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { roles: ["admin"] });
        const result = await testHelper.executeGraphQLWithToken(mutation, token);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: [
                    {
                        Name: "A Movie",
                        Directors: [{ Name: "A Director" }],
                        Genres: [{ Name: "Action" }],
                    },
                ],
            },
        });
    });
});

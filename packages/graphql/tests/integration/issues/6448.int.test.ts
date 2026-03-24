/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/6448", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Studio: UniqueType;
    let Actor: UniqueType;

    let typeDefs: string;
    const secret = "sssh";

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Studio = testHelper.createUniqueType("Studio");
        Actor = testHelper.createUniqueType("Actor");

        typeDefs = /* GraphQL */ `
            type ${Movie}
                @authorization(validate: [{ operations: [UPDATE], where: { node: { MyRoles_INCLUDES: "admin" } } }])
                @node {
                Id: ID!
                Name: String!
                MyRoles: [String!]!
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN ['admin'] as roles
                        """
                        columnName: "roles"
                    )
                Actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                Studio: [${Studio}!]! @relationship(type: "PRODUCED_BY", direction: OUT)
            }

            type ${Studio}
                @authorization(validate: [{ operations: [UPDATE], where: { node: { MyRoles_INCLUDES: "admin" } } }])
                @node {
                Id: ID!
                Name: String!
                Movies: [${Movie}!]! @relationship(type: "PRODUCED_BY", direction: IN)
                MyRoles: [String!]!
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN ['admin'] as roles
                        """
                        columnName: "roles"
                    )
            }

            type ${Actor}
                @authorization(validate: [{ operations: [UPDATE], where: { node: { MyRoles_INCLUDES: "admin" } } }])
                @node {
                Id: ID!
                Name: String!
                Movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                MyRoles: [String!]!
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN ['admin'] as roles
                        """
                        columnName: "roles"
                    )
            }
        `;

        await testHelper.executeCypher(`
            CREATE (:${Studio} { Name: "A Studio" })<-[:PRODUCED_BY]-(:${Movie} { Name: "A Movie" })
            CREATE (:${Actor} {Name: "An Actor"})
        `);
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

    test("mutation is valid cypher", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Studio.operations.update}(
                    where: { Name: {eq: "A Studio"} }
                    update: {
                        Movies: [
                            {
                                update: { 
                                    node: { Actors: [{ connect: [{ where: { node: { Name: {eq: "An Actor"} } } }] }] } 
                                    where: { node: { Name: {eq: "A Movie"} } }
                                }
                            }
                        ]
                    }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret);

        const queryResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Studio.operations.update]: {
                info: {
                    relationshipsCreated: 1,
                },
            },
        });
    });
});

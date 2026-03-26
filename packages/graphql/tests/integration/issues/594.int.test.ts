/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/594", () => {
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typePerson: UniqueType;

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typePerson = testHelper.createUniqueType("Person");
        const typeDefs = gql`
            type ${typeMovie.name} @node {
                title: String!
                actors: [${typePerson.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typePerson.name} @node {
                name: String!
                nickname: String
                surname: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`CREATE (:${typeMovie.name} {title: "Cool Movie"})<-[:ACTED_IN]-(:${typePerson.name} {name: "Some Name", nickname: "SName"})
                CREATE (:${typeMovie.name} {title: "Super Cool Movie"})<-[:ACTED_IN]-(:${typePerson.name} {name: "Super Cool Some Name"})`);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should support nullable fields in field aggregations", async () => {
        const query = `
            query {
                ${typeMovie.plural} {
                    actorsConnection {
                        aggregate {
                          node {
                            nickname {
                                shortest
                                }
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.plural]).toEqual(
            expect.toIncludeSameMembers([
                { actorsConnection: { aggregate: { node: { nickname: { shortest: "SName" } } } } },
                { actorsConnection: { aggregate: { node: { nickname: { shortest: null } } } } },
            ])
        );
    });

    test("should support nullable fields in aggregations", async () => {
        const query = `
            query {
                ${typePerson.plural}Connection {
                    aggregate {
                        node {
                            surname {
                              shortest
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[`${typePerson.plural}Connection`]).toEqual({
            aggregate: { node: { surname: { shortest: null } } },
        });
    });
});

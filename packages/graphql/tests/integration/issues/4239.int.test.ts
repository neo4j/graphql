/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4239", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = `
                type ${Movie.name} @node
                @authorization(
                    validate: [
                        { when: [BEFORE], where: { node: { directorConnection_SOME: { node: { id_EQ: "$jwt.sub" } } } } }
                    ]
                ) {
                title: String
                director: [${Person.name}!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type ${Person.name} @node {
                id: ID
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

        await testHelper.executeCypher(
            `CREATE (m:${Movie.name} {title: "Matrix"})<-[:DIRECTED]-(p:${Person.name} {id: "SOME_ID"})`
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return Matrix if the JWT.sub matches", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            contextValue: { jwt: { sub: "SOME_ID" } },
        });
        expect(response.errors).toBeFalsy();
        expect(response.data?.[Movie.plural]).toStrictEqual(
            expect.arrayContaining([expect.objectContaining({ title: "Matrix" })])
        );
    });

    test("should return a Forbidden error if the JWT.sub do not matches", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query, {
            contextValue: { jwt: { sub: "SOME_WRONG_ID" } },
        });
        expect((response.errors as any[])[0].message).toBe("Forbidden");
    });
});

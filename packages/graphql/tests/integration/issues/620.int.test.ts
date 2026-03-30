/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/620", () => {
    const testHelper = new TestHelper();

    let typeUser: UniqueType;
    let typeBusiness: UniqueType;

    beforeAll(async () => {
        typeUser = testHelper.createUniqueType("User");
        typeBusiness = testHelper.createUniqueType("Business");

        const typeDefs = gql`
            type ${typeUser.name} @node {
                id: String
                name: String
            }
            type ${typeBusiness.name} @node {
                id: String
                name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`
              CREATE (u:${typeUser.name} {id: "1234", name: "arthur"})
              CREATE (b:${typeBusiness.name} {id: "1234", name: "ford"})
            `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return topic count", async () => {
        const query = `
            query {
                ${typeUser.plural}(where: { id_EQ: "1234"}) {
                    id
                    name
                }
                ${typeBusiness.plural}(where: { id_EQ: "1234" }) {
                    id
                    name
                }
            }
        `;

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [typeBusiness.plural]: [
                {
                    id: "1234",
                    name: "ford",
                },
            ],
            [typeUser.plural]: [
                {
                    id: "1234",
                    name: "arthur",
                },
            ],
        });
    });
});

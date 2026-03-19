/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5887 list relationship", () => {
    let House: UniqueType;
    let Animal: UniqueType;
    let Cat: UniqueType;
    let Dog: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        House = testHelper.createUniqueType("House");
        Animal = testHelper.createUniqueType("Animal");
        Cat = testHelper.createUniqueType("Cat");
        Dog = testHelper.createUniqueType("Dog");

        const typeDefs = /* GraphQL */ `
            type ${House} @node {
                address: String!
                animals: [${Animal}!]! @relationship(type: "LIVES_IN", direction: IN)
            }

            interface ${Animal} {
                name: String!
            }

            type ${Dog} implements ${Animal} @node {
                name: String!
            }

            type ${Cat} implements ${Animal} @node {
                name: String!
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return relationship when first interface match", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Dog} {name: "Roxy"})-[:LIVES_IN]->(h:${House} {address: "Toulouse"})
            CREATE (:${Cat} {name: "Nala"})-[:LIVES_IN]->(h)
        `);

        const query = /* GraphQL */ `
            query {
                ${House.plural}(where: { animals_SOME: { name_EQ: "Roxy" } }) {
                    address
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [House.plural]: [{ address: "Toulouse" }],
        });
    });

    test("should return relationship when second interface match", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Dog} {name: "Roxy"})-[:LIVES_IN]->(h:${House} {address: "Toulouse"})
            CREATE (:${Cat} {name: "Nala"})-[:LIVES_IN]->(h)
        `);

        const query = /* GraphQL */ `
            query {
                ${House.plural}(where: { animals_SOME: { name_EQ: "Nala" } }) {
                    address
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [House.plural]: [{ address: "Toulouse" }],
        });
    });

    test("should not return relationship when no interface match", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Dog} {name: "Roxy"})-[:LIVES_IN]->(h:${House} {address: "Toulouse"})
            CREATE (:${Cat} {name: "Nala"})-[:LIVES_IN]->(h)
        `);

        const query = /* GraphQL */ `
            query {
                ${House.plural}(where: { animals_SOME: { name_EQ: "Other" } }) {
                    address
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [House.plural]: [],
        });
    });
});

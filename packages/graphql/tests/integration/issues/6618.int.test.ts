/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/6618", () => {
    const testHelper = new TestHelper();

    let ProductInstance: UniqueType;
    let Asset: UniqueType;

    beforeEach(async () => {
        ProductInstance = testHelper.createUniqueType("ProductInstance");
        Asset = testHelper.createUniqueType("Asset");

        const typeDefs = /* GraphQL */ `
            type ${ProductInstance} @limit(max: 100, default: 2) @node {
                serialNumber: String!
            }

            type ${Asset} @node {
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("connection totalCount returns correct counts when type has @limit", async () => {
        // Seed a few nodes (tiny dataset; integration tests run against DB)
        await testHelper.executeCypher(
            `
            CREATE (:${ProductInstance} { serialNumber: "A" })
            CREATE (:${ProductInstance} { serialNumber: "B" })
            CREATE (:${ProductInstance} { serialNumber: "C" })
            CREATE (:${Asset} { name: "X" })
            CREATE (:${Asset} { name: "Y" })
        `
        );

        const query = /* GraphQL */ `
            query {
                ${ProductInstance.plural}Connection { totalCount }
                ${Asset.plural}Connection { totalCount }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [`${ProductInstance.plural}Connection`]: { totalCount: 3 },
            [`${Asset.plural}Connection`]: { totalCount: 2 },
        });
    });
});

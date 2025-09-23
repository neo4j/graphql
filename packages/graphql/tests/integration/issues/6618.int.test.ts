/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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

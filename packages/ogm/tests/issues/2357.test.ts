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

import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "../integration/neo4j";
import { OGM } from "../../src";
import { UniqueType } from "../utils";

describe("https://github.com/neo4j/graphql/issues/2357", () => {
    let driver: Driver;
    let typeDefs: string;
    let enterpriseType: {
        name: string;
        plural: string;
    };
    let indexName: string;

    const id1 = "1";
    const id2 = "2";
    const matchingFullName = "some full name";
    const matchingTags = "phrase";
    const searchPhrase = "some phrase";
    const nonMatchingFullName = "foo";
    const nonMatchingTags = "baa";

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(async () => {
        enterpriseType = new UniqueType("Enterprise");
        indexName = `${enterpriseType.name}_fulltext_index`;

        typeDefs = `
            type ${enterpriseType.name} @fulltext(indexes: [{ indexName: "${indexName}", fields: ["full_name", "tags"] }]){
                id: ID! @id
                full_name: String!
                tags: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        await neoSchema.getSchema();
        await neoSchema.assertIndexesAndConstraints({ driver, options: { create: true } });

        const session = driver.session();

        try {
            await session.run(`
                CREATE (:${enterpriseType.name} { id: "${id1}", full_name: "${matchingFullName}", tags: "${matchingTags}" })
                CREATE (:${enterpriseType.name} { id: "${id2}", full_name: "${nonMatchingFullName}", tags: "${nonMatchingTags}" })
            `);
        } finally {
            await session.close();
        }
    });

    afterEach(async () => {
        const session = driver.session();

        try {
            await session.run(`
                MATCH (n:${enterpriseType.name})
                DETACH DELETE n
            `);
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should filter using fulltext index", async () => {
        const ogm = new OGM({ typeDefs, driver });

        await ogm.init();

        const Enterprise = ogm.model(enterpriseType.name);
        const result = await Enterprise.find({
            fulltext: {
                [indexName]: { phrase: searchPhrase },
            },
        });

        expect(result).toEqual([{ id: id1, full_name: matchingFullName, tags: matchingTags }]);
    });

    test("should not filter if fulltext arg is not applied", async () => {
        const ogm = new OGM({ typeDefs, driver });

        await ogm.init();

        const Enterprise = ogm.model(enterpriseType.name);
        const result = await Enterprise.find({});

        expect(result).toHaveLength(2);
    });
});

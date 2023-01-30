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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src";
import { UniqueType } from "../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1628", () => {
    const workType = new UniqueType("Work");
    const titleType = new UniqueType("Title");

    let schema: GraphQLSchema;
    let neo4j: Neo4j;
    let driver: Driver;
    let session: Session;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = `
            type ${workType} @node(additionalLabels: ["Resource"]) @exclude(operations: [CREATE, UPDATE, DELETE]) {
                """
                IRI
                """
                iri: ID! @unique @alias(property: "uri")
                title: [${titleType}!]! @relationship(type: "title", direction: OUT)
            }

            type ${titleType} @node(additionalLabels: ["property"]) @exclude(operations: [CREATE, UPDATE, DELETE]) {
                value: String
            }
        `;
        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        schema = await neoGraphql.getSchema();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Nested filter with limit cypher should be composed correctly", async () => {
        const query = `
            {
                ${workType.plural}(options: { limit: 1 }, where: { title: { value_CONTAINS: "0777" } }) {
                    title(where: { value_CONTAINS: "0777" }) {
                        value
                    }
                }
            }
        `;

        await session.run(`
            CREATE (t:${workType}:Resource)-[:title]->(:${titleType}:property {value: "bond0777"})
            CREATE (t)-[:title]->(:${titleType}:property {value: "bond0777"})
        `);

        const result = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [workType.plural]: [
                {
                    title: [
                        {
                            value: "bond0777",
                        },
                        {
                            value: "bond0777",
                        },
                    ],
                },
            ],
        });
    });
});

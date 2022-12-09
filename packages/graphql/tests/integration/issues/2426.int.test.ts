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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import gql from "graphql-tag";
import { getQuerySource } from "../../utils/get-query-source";

describe("https://github.com/neo4j/graphql/issues/2426", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        const typeDefs = gql`
            type A {
                uuid: ID! @id
            }
            type B {
                uuid: ID! @id
            }
            union C = A | B
            type D {
                uuid: ID! @id
                test: String!
                requiredUnion: C! @relationship(type: "RELATED", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    test("should throw an error because of missing argument", async () => {
        const query = gql`
            mutation CreateDs($input: [DCreateInput!]!) {
                createDs(input: $input) {
                    ds {
                        test
                    }
                }
            }
        `;

        const variableValues = {
            input: [
                {
                    test: "bla",
                },
            ],
        };

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: getQuerySource(query),
            contextValue: neo4j.getContextValues(),
            variableValues,
        });

        expect(result.errors).toMatchInlineSnapshot(`
            Array [
              [GraphQLError: Variable "$input" got invalid value { test: "bla" } at "input[0]"; Field "requiredUnion" of required type "DRequiredUnionCreateInput!" was not provided.],
            ]
        `);
    });
});

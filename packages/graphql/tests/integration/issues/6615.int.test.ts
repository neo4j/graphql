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

describe("https://github.com/neo4j/graphql/issues/6615", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let Product: UniqueType;

    beforeAll(async () => {
        Product = testHelper.createUniqueType("Product");

        typeDefs = /* GraphQL */ `
            type ${Product} @node {
                pco_i18n: [I18nCountryIntMapping!]!
                    @cypher(
                        statement: """
                        WITH [x IN keys(this) WHERE x STARTS WITH 'pco_' | {country:split(x, '_')[1],value:this[x]}] AS list UNWIND list AS x RETURN x AS result
                        """
                        columnName: "result"
                    )
                pco_AT: Int
                pco_AU: Int
            }

            type I18nCountryIntMapping {
                value: Int
                country: String
            }

            type Query {
                topLevel_i18n: [I18nCountryIntMapping!]!
                    @cypher(
                        statement: """
                        MATCH(this:${Product})
                        WITH [x IN keys(this) WHERE x STARTS WITH 'pco_' | {country:split(x, '_')[1],value:this[x]}] AS list UNWIND list AS x RETURN x AS result
                        """
                        columnName: "result"
                    )
            }
        `;

        await testHelper.executeCypher(`
            CREATE (p:${Product}{pco_AT:4, pco_AU:3})
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("int should be properly parsed on cypher field returning object", async () => {
        const query = /* GraphQL */ `
            query {
                ${Product.plural} {
                    pco_AT
                    pco_i18n {
                        value
                        country
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Product.plural]: [
                {
                    pco_AT: 4,
                    pco_i18n: expect.toIncludeSameMembers([
                        {
                            value: 4,
                            country: "AT",
                        },
                        {
                            value: 3,
                            country: "AU",
                        },
                    ]),
                },
            ],
        });
    });

    test("int should be properly parsed on top level cypher field returning object", async () => {
        const query = /* GraphQL */ `
            query {
                topLevel_i18n {
                    value
                    country
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            topLevel_i18n: expect.toIncludeSameMembers([
                {
                    value: 4,
                    country: "AT",
                },
                {
                    value: 3,
                    country: "AU",
                },
            ]),
        });
    });
});

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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/6291", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Pear {
                name: String!
                apples: [Apple!]! @relationship(type: "HAS_APPLE", direction: OUT)
            }

            type Apple {
                # filter on apple.banana.price
                banana: Banana! @relationship(type: "HAS_BANANA", direction: OUT)

                # filter on apple.grape.carrot.potato.number
                grape: Grape! @relationship(type: "HAS_GRAPE", direction: OUT)
            }

            type Banana {
                price: String!
            }

            type Grape {
                carrot: Carrot @relationship(type: "HAS_CARROT", direction: OUT)
            }

            type Carrot {
                potato: Potato! @relationship(type: "HAS_POTATO", direction: IN)
            }

            type Potato {
                number: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should be able to filters pears by non nullable single relationships", async () => {
        const query = /* GraphQL */ `
            query {
                pears(
                    where: {
                        apples_SOME: { banana: { price: "awdawd" }, grape: { carrot: { potato: { number: "abc" } } } }
                    }
                ) {
                    name
                }
            }
        `;

        const { cypher, params } = await translateQuery(neoSchema, query);

        expect(formatCypher(cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Pear)
            WHERE EXISTS {
                MATCH (this)-[:HAS_APPLE]->(this0:Apple)
                WHERE (single(this1 IN [(this0)-[:HAS_BANANA]->(this1:Banana) WHERE this1.price = $param0 | 1] WHERE true) AND single(this4 IN [(this0)-[:HAS_GRAPE]->(this4:Grape) WHERE single(this3 IN [(this4)-[:HAS_CARROT]->(this3:Carrot) WHERE single(this2 IN [(this3)<-[:HAS_POTATO]-(this2:Potato) WHERE this2.number = $param1 | 1] WHERE true) | 1] WHERE true) | 1] WHERE true))
            }
            RETURN this { .name } AS this"
        `);
        expect(formatParams(params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"awdawd\\",
                \\"param1\\": \\"abc\\"
            }"
        `);
    });
});

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

import gql from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/3394", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = `#graphql
        type Product {
            id: String! @alias(property: "fg_item_id")
            description: String!
            partNumber: ID! @alias(property: "fg_item")
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should sort by aliased field", async () => {
        const query = gql`
            query listProducts {
                products(options: { sort: { partNumber: DESC } }) {
                    id
                    partNumber
                    description
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Product\`)
            WITH *
            ORDER BY this.fg_item DESC
            RETURN this { id: this.fg_item_id, partNumber: this.fg_item, .description } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});

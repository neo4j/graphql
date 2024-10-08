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

describe("https://github.com/neo4j/graphql/issues/4477", () => {
    test("filtering by count on an aggregate should work", async () => {
        const typeDefs = /* GraphQL */ `
            type Brand @node {
                services: [Service!]! @relationship(type: "HAS_SERVICE", direction: OUT)
                name: String!
            }

            type Collection @node {
                services: [Service!]! @relationship(type: "HAS_SERVICE", direction: OUT)
            }

            type Service @node {
                collection: Collection @relationship(type: "HAS_SERVICE", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
            query {
                brands {
                    name
                    services(where: { collectionAggregate: { count_EQ: 0 } }) {
                        collectionAggregate {
                            count
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Brand)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_SERVICE]->(this1:Service)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:HAS_SERVICE]-(this3:Collection)
                    RETURN count(this3) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                CALL {
                    WITH this1
                    MATCH (this1)<-[this5:HAS_SERVICE]-(this6:Collection)
                    RETURN count(this6) AS var7
                }
                WITH this1 { collectionAggregate: { count: var7 } } AS this1
                RETURN collect(this1) AS var8
            }
            RETURN this { .name, services: var8 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                }
            }"
        `);
    });
});

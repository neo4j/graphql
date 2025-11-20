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

describe("https://github.com/neo4j/graphql/issues/2249", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
            }

            type Review @relationshipProperties {
                score: Int!
            }

            type Person implements Reviewer @node {
                name: String!
                reputation: Int!
                id: Int
                reviewerId: Int
            }

            type Influencer implements Reviewer @node {
                reputation: Int!
                url: String!
                reviewerId: Int
            }

            interface Reviewer {
                reputation: Int!
                reviewerId: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("nested update with create should generate a single relationship with the nested value", async () => {
        const query = /* GraphQL */ `
            mutation UpdateMovies {
                updateMovies(
                    where: { title: { eq: "John Wick" } }
                    update: {
                        reviewers: [
                            { create: [{ edge: { score: 10 }, node: { Person: { reputation: 100, name: "Ana" } } }] }
                        ]
                    }
                ) {
                    movies {
                        title
                        reviewers {
                            ... on Person {
                                name
                                reputation
                            }
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.title = $param0
            WITH *
            CALL (*) {
                CREATE (this0:Person)
                MERGE (this)<-[this1:REVIEWED]-(this0)
                SET
                    this0.name = $param1,
                    this0.reputation = $param2,
                    this1.score = $param3
            }
            WITH this
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)<-[this2:REVIEWED]-(this3:Person)
                    WITH this3 { .name, .reputation, __resolveType: \\"Person\\", __id: id(this3) } AS var4
                    RETURN var4
                    UNION
                    WITH *
                    MATCH (this)<-[this5:REVIEWED]-(this6:Influencer)
                    WITH this6 { __resolveType: \\"Influencer\\", __id: id(this6) } AS var4
                    RETURN var4
                }
                WITH var4
                RETURN collect(var4) AS var4
            }
            RETURN this { .title, reviewers: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"John Wick\\",
                \\"param1\\": \\"Ana\\",
                \\"param2\\": {
                    \\"low\\": 100,
                    \\"high\\": 0
                },
                \\"param3\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });
});

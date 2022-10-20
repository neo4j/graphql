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

import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2269", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
            }

            interface Review @relationshipProperties {
                score: Int!
            }

            type Person implements Reviewer {
                name: String!
                reputation: Int!
                id: Int @unique
                reviewerId: Int @unique
            }

            type Influencer implements Reviewer {
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
        const query = gql`
            mutation UpdateMovies {
                updateMovies(
                    where: { title: "John Wick" }
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
            "MATCH (this:\`Movie\`)
            WHERE this.title = $param0
            WITH this
            CALL {
            	 WITH this
            WITH this
            CREATE (this_reviewers0_create0_node:Movie)
            MERGE (this)<-[this_reviewers0_create0_relationship:REVIEWED]-(this_reviewers0_create0_node)
            SET this_reviewers0_create0_relationship.score = $updateMovies.args.update.reviewers[0].create[0].edge.score
            RETURN count(*) AS update_this_Person
            }
            CALL {
            	 WITH this
            	WITH this
            CREATE (this_reviewers0_create0_node:Movie)
            MERGE (this)<-[this_reviewers0_create0_relationship:REVIEWED]-(this_reviewers0_create0_node)
            SET this_reviewers0_create0_relationship.score = $updateMovies.args.update.reviewers[0].create[0].edge.score
            RETURN count(*) AS update_this_Influencer
            }
            WITH *
            WITH *
            CALL {
            WITH this
            CALL {
                WITH this
                MATCH (this)<-[update_this0:REVIEWED]-(this_Person:\`Person\`)
                RETURN { __resolveType: \\"Person\\", name: this_Person.name, reputation: this_Person.reputation } AS this_reviewers
                UNION
                WITH this
                MATCH (this)<-[update_this1:REVIEWED]-(this_Influencer:\`Influencer\`)
                RETURN { __resolveType: \\"Influencer\\" } AS this_reviewers
            }
            RETURN collect(this_reviewers) AS this_reviewers
            }
            RETURN collect(DISTINCT this { .title, reviewers: this_reviewers }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"John Wick\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"reviewers\\": [
                                {
                                    \\"create\\": [
                                        {
                                            \\"node\\": {
                                                \\"Person\\": {
                                                    \\"name\\": \\"Ana\\",
                                                    \\"reputation\\": {
                                                        \\"low\\": 100,
                                                        \\"high\\": 0
                                                    }
                                                }
                                            },
                                            \\"edge\\": {
                                                \\"score\\": {
                                                    \\"low\\": 10,
                                                    \\"high\\": 0
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

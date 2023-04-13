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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("#582", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Entity {
                children: [Entity!]! @relationship(type: "EDGE", properties: "Edge", direction: OUT)
                parents: [Entity!]! @relationship(type: "EDGE", properties: "Edge", direction: IN)
                type: String!
            }

            interface Edge @relationshipProperties {
                type: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should be able to nest connection where inputs", async () => {
        const query = gql`
            query ($where: EntityWhere) {
                entities(where: $where) {
                    type
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                where: {
                    type: "Cat",
                    childrenConnection: {
                        node: {
                            type: "Dog",
                            parentsConnection: {
                                node: {
                                    type: "Bird",
                                },
                            },
                        },
                    },
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Entity\`)
            WHERE (this.type = $param0 AND EXISTS {
                MATCH (this)-[this0:EDGE]->(this1:\`Entity\`)
                WHERE (this1.type = $param1 AND EXISTS {
                    MATCH (this1)<-[this2:EDGE]-(this3:\`Entity\`)
                    WHERE this3.type = $param2
                })
            })
            RETURN this { .type } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Cat\\",
                \\"param1\\": \\"Dog\\",
                \\"param2\\": \\"Bird\\"
            }"
        `);
    });

    test("should be able to nest connection where inputs down more levels", async () => {
        const query = gql`
            query ($where: EntityWhere) {
                entities(where: $where) {
                    type
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                where: {
                    type: "Cat",
                    childrenConnection: {
                        node: {
                            type: "Dog",
                            parentsConnection: {
                                node: {
                                    type: "Bird",
                                    childrenConnection: {
                                        node: {
                                            type: "Fish",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Entity\`)
            WHERE (this.type = $param0 AND EXISTS {
                MATCH (this)-[this0:EDGE]->(this1:\`Entity\`)
                WHERE (this1.type = $param1 AND EXISTS {
                    MATCH (this1)<-[this2:EDGE]-(this3:\`Entity\`)
                    WHERE (this3.type = $param2 AND EXISTS {
                        MATCH (this3)-[this4:EDGE]->(this5:\`Entity\`)
                        WHERE this5.type = $param3
                    })
                })
            })
            RETURN this { .type } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Cat\\",
                \\"param1\\": \\"Dog\\",
                \\"param2\\": \\"Bird\\",
                \\"param3\\": \\"Fish\\"
            }"
        `);
    });
});

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
            CALL {
                WITH this
                MATCH (this)-[this0:EDGE]->(this1:\`Entity\`)
                CALL {
                    WITH this1
                    MATCH (this3:\`Entity\`)-[this2:EDGE]->(this1)
                    WHERE this3.type = $param0
                    RETURN count(this2) AS var4
                }
                WITH *
                WHERE (this1.type = $param1 AND var4 > 0)
                RETURN count(this0) AS var5
            }
            WITH *
            WHERE (this.type = $param2 AND var5 > 0)
            RETURN this { .type } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Bird\\",
                \\"param1\\": \\"Dog\\",
                \\"param2\\": \\"Cat\\"
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
            CALL {
                WITH this
                MATCH (this)-[this0:EDGE]->(this1:\`Entity\`)
                CALL {
                    WITH this1
                    MATCH (this3:\`Entity\`)-[this2:EDGE]->(this1)
                    CALL {
                        WITH this3
                        MATCH (this3)-[this4:EDGE]->(this5:\`Entity\`)
                        WHERE this5.type = $param0
                        RETURN count(this4) AS var6
                    }
                    WITH *
                    WHERE (this3.type = $param1 AND var6 > 0)
                    RETURN count(this2) AS var7
                }
                WITH *
                WHERE (this1.type = $param2 AND var7 > 0)
                RETURN count(this0) AS var8
            }
            WITH *
            WHERE (this.type = $param3 AND var8 > 0)
            RETURN this { .type } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Fish\\",
                \\"param1\\": \\"Bird\\",
                \\"param2\\": \\"Dog\\",
                \\"param3\\": \\"Cat\\"
            }"
        `);
    });
});

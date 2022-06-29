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
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

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
            WHERE (this.type = $param0
            AND (exists((this)-[:\`EDGE\`]->(:\`Entity\`))
            AND ANY(var3 IN [(this)-[this1:\`EDGE\`]->(this2:\`Entity\`) | { node: this2, relationship: this1 }]
                        WHERE var3.node.type = $nestedParam1.node.type AND apoc.cypher.runFirstColumn(\\"RETURN EXISTS((var3_node)<-[:EDGE]-(:Entity))
            AND ANY(var3_node_Entity_map IN [(var3_node)<-[var3_node_Entity_EntityParentsRelationship:EDGE]-(var3_node_Entity:Entity) | { node: var3_node_Entity, relationship: var3_node_Entity_EntityParentsRelationship } ] WHERE
            var3_node_Entity_map.node.type = $nestedParam1.node.parentsConnection.node.type
            )\\", { var3_node: var3.node, nestedParam1: $nestedParam1 }))))
            RETURN this { .type } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Cat\\",
                \\"nestedParam1\\": {
                    \\"node\\": {
                        \\"type\\": \\"Dog\\",
                        \\"parentsConnection\\": {
                            \\"node\\": {
                                \\"type\\": \\"Bird\\"
                            }
                        }
                    }
                }
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
            WHERE (this.type = $param0
            AND (exists((this)-[:\`EDGE\`]->(:\`Entity\`))
            AND ANY(var3 IN [(this)-[this1:\`EDGE\`]->(this2:\`Entity\`) | { node: this2, relationship: this1 }]
                        WHERE var3.node.type = $nestedParam1.node.type AND apoc.cypher.runFirstColumn(\\"RETURN EXISTS((var3_node)<-[:EDGE]-(:Entity))
            AND ANY(var3_node_Entity_map IN [(var3_node)<-[var3_node_Entity_EntityParentsRelationship:EDGE]-(var3_node_Entity:Entity) | { node: var3_node_Entity, relationship: var3_node_Entity_EntityParentsRelationship } ] WHERE
            var3_node_Entity_map.node.type = $nestedParam1.node.parentsConnection.node.type AND apoc.cypher.runFirstColumn(\\\\\\"RETURN EXISTS((var3_node_Entity_map_node)-[:EDGE]->(:Entity))
            AND ANY(var3_node_Entity_map_node_Entity_map IN [(var3_node_Entity_map_node)-[var3_node_Entity_map_node_Entity_EntityChildrenRelationship:EDGE]->(var3_node_Entity_map_node_Entity:Entity) | { node: var3_node_Entity_map_node_Entity, relationship: var3_node_Entity_map_node_Entity_EntityChildrenRelationship } ] WHERE
            var3_node_Entity_map_node_Entity_map.node.type = $nestedParam1.node.parentsConnection.node.childrenConnection.node.type
            )\\\\\\", { var3_node_Entity_map_node: var3_node_Entity_map.node, nestedParam1: $nestedParam1 })
            )\\", { var3_node: var3.node, nestedParam1: $nestedParam1 }))))
            RETURN this { .type } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Cat\\",
                \\"nestedParam1\\": {
                    \\"node\\": {
                        \\"type\\": \\"Dog\\",
                        \\"parentsConnection\\": {
                            \\"node\\": {
                                \\"type\\": \\"Bird\\",
                                \\"childrenConnection\\": {
                                    \\"node\\": {
                                        \\"type\\": \\"Fish\\"
                                    }
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });
});

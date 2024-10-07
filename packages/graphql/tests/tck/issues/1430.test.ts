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

describe("https://github.com/neo4j/graphql/issues/1430", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type ABCE @node {
                id: ID @id @unique
                name: String
                interface: InterfaceMom @relationship(type: "HAS_INTERFACE", direction: OUT)
            }

            interface InterfaceMom {
                id: ID
                name: String
            }

            type ChildOne implements InterfaceMom @node {
                id: ID @id @unique
                name: String
                feathur: String
            }

            type ChildTwo implements InterfaceMom @node {
                id: ID @id @unique
                name: String
                sth: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should not allow to create more than one node for a one-to-one relationship", async () => {
        const query = /* GraphQL */ `
            mutation ddfs {
                updateAbces(
                    where: { id_EQ: "TestID" }
                    create: { interface: { node: { ChildOne: { name: "childone name2" } } } }
                ) {
                    abces {
                        id
                        interface {
                            id
                            name
                            __typename
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:ABCE)
            WHERE this.id = $param0
            WITH *
            WHERE apoc.util.validatePredicate(EXISTS((this)-[:HAS_INTERFACE]->(:ChildOne)) OR EXISTS((this)-[:HAS_INTERFACE]->(:ChildTwo)),'Relationship field \\"%s.%s\\" cannot have more than one node linked',[\\"ABCE\\",\\"interface\\"])
            CREATE (this_create_interface_ChildOne0_node_ChildOne:ChildOne)
            SET this_create_interface_ChildOne0_node_ChildOne.id = randomUUID()
            SET this_create_interface_ChildOne0_node_ChildOne.name = $this_create_interface_ChildOne0_node_ChildOne_name
            MERGE (this)-[:HAS_INTERFACE]->(this_create_interface_ChildOne0_node_ChildOne)
            WITH *
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[update_this0:HAS_INTERFACE]->(update_this1:ChildOne)
                    WITH update_this1 { .id, .name, __resolveType: \\"ChildOne\\", __id: id(update_this1) } AS update_this1
                    RETURN update_this1 AS update_var2
                    UNION
                    WITH *
                    MATCH (this)-[update_this3:HAS_INTERFACE]->(update_this4:ChildTwo)
                    WITH update_this4 { .id, .name, __resolveType: \\"ChildTwo\\", __id: id(update_this4) } AS update_this4
                    RETURN update_this4 AS update_var2
                }
                WITH update_var2
                RETURN head(collect(update_var2)) AS update_var2
            }
            RETURN collect(DISTINCT this { .id, interface: update_var2 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"TestID\\",
                \\"this_create_interface_ChildOne0_node_ChildOne_name\\": \\"childone name2\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("should not allow connecting a second node to an existing one-to-one relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateAbces(
                    where: { id: "TestId" }
                    update: { interface: { connect: { where: { node: { name: "childone name connect" } } } } }
                ) {
                    abces {
                        id
                        interface {
                            id
                            name
                            __typename
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:ABCE)
            WHERE this.id = $param0
            WITH this
            CALL {
            	 WITH this
            WITH *
            WHERE apoc.util.validatePredicate(EXISTS((this)-[:HAS_INTERFACE]->(:ChildOne)) OR EXISTS((this)-[:HAS_INTERFACE]->(:ChildTwo)),'Relationship field \\"%s.%s\\" cannot have more than one node linked',[\\"ABCE\\",\\"interface\\"])
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_interface0_connect0_node:ChildOne)
            	WHERE this_interface0_connect0_node.name = $this_interface0_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_interface0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_interface0_connect0_node
            			MERGE (this)-[:HAS_INTERFACE]->(this_interface0_connect0_node)
            		}
            	}
            WITH this, this_interface0_connect0_node
            	RETURN count(*) AS connect_this_interface0_connect_ChildOne0
            }
            RETURN count(*) AS update_this_ChildOne
            }
            CALL {
            	 WITH this
            	WITH *
            WHERE apoc.util.validatePredicate(EXISTS((this)-[:HAS_INTERFACE]->(:ChildOne)) OR EXISTS((this)-[:HAS_INTERFACE]->(:ChildTwo)),'Relationship field \\"%s.%s\\" cannot have more than one node linked',[\\"ABCE\\",\\"interface\\"])
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_interface0_connect0_node:ChildTwo)
            	WHERE this_interface0_connect0_node.name = $this_interface0_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_interface0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_interface0_connect0_node
            			MERGE (this)-[:HAS_INTERFACE]->(this_interface0_connect0_node)
            		}
            	}
            WITH this, this_interface0_connect0_node
            	RETURN count(*) AS connect_this_interface0_connect_ChildTwo0
            }
            RETURN count(*) AS update_this_ChildTwo
            }
            WITH *
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[update_this0:HAS_INTERFACE]->(update_this1:ChildOne)
                    WITH update_this1 { .id, .name, __resolveType: \\"ChildOne\\", __id: id(update_this1) } AS update_this1
                    RETURN update_this1 AS update_var2
                    UNION
                    WITH *
                    MATCH (this)-[update_this3:HAS_INTERFACE]->(update_this4:ChildTwo)
                    WITH update_this4 { .id, .name, __resolveType: \\"ChildTwo\\", __id: id(update_this4) } AS update_this4
                    RETURN update_this4 AS update_var2
                }
                WITH update_var2
                RETURN head(collect(update_var2)) AS update_var2
            }
            RETURN collect(DISTINCT this { .id, interface: update_var2 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"TestId\\",
                \\"this_interface0_connect0_node_param0\\": \\"childone name connect\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

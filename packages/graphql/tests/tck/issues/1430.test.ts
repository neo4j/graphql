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

describe("https://github.com/neo4j/graphql/issues/1430", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type ABCE {
                id: ID @id
                name: String
                interface: InterfaceMom @relationship(type: "HAS_INTERFACE", direction: OUT)
            }

            interface InterfaceMom {
                id: ID @id
                name: String
            }

            type ChildOne implements InterfaceMom {
                id: ID @id
                name: String
                feathur: String
            }

            type ChildTwo implements InterfaceMom {
                id: ID @id
                name: String
                sth: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should not allow to create more than one node for a one-to-one relationship", async () => {
        const query = gql`
            mutation ddfs {
                updateAbces(
                    where: { id: "TestID" }
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
            "MATCH (this:\`ABCE\`)
            WHERE this.id = $param0
            CALL apoc.util.validate(EXISTS((this)-[:HAS_INTERFACE]->(:ChildOne)),'Relationship field \\"%s.%s\\" cannot have more than one node linked',[\\"ABCE\\",\\"interface\\"])
            CREATE (this_create_interface_ChildOne0_node_ChildOne:ChildOne)
            SET this_create_interface_ChildOne0_node_ChildOne.id = randomUUID()
            SET this_create_interface_ChildOne0_node_ChildOne.name = $this_create_interface_ChildOne0_node_ChildOne_name
            MERGE (this)-[:HAS_INTERFACE]->(this_create_interface_ChildOne0_node_ChildOne)
            WITH *
            WITH this
            CALL {
                WITH this
                MATCH (this)-[update_this0:HAS_INTERFACE]->(this_ChildOne:\`ChildOne\`)
                RETURN { __resolveType: \\"ChildOne\\", id: this_ChildOne.id, name: this_ChildOne.name } AS this_interface
                UNION
                WITH this
                MATCH (this)-[update_this1:HAS_INTERFACE]->(this_ChildTwo:\`ChildTwo\`)
                RETURN { __resolveType: \\"ChildTwo\\", id: this_ChildTwo.id, name: this_ChildTwo.name } AS this_interface
            }
            RETURN collect(DISTINCT this { .id, interface: this_interface }) AS data"
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
        const query = gql`
            mutation {
                updateAbces(
                    where: { id: "TestId" }
                    connect: { interface: { where: { node: { name: "childone name connect" } } } }
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
            "MATCH (this:\`ABCE\`)
            WHERE this.id = $param0
            CALL apoc.util.validate(EXISTS((this)-[:HAS_INTERFACE]->(:ChildOne)),'Relationship field \\"%s.%s\\" cannot have more than one node linked',[\\"ABCE\\",\\"interface\\"])
            CALL apoc.util.validate(EXISTS((this)-[:HAS_INTERFACE]->(:ChildTwo)),'Relationship field \\"%s.%s\\" cannot have more than one node linked',[\\"ABCE\\",\\"interface\\"])
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_interface0_node:ChildOne)
            	WHERE this_connect_interface0_node.name = $this_connect_interface0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_interface0_node) as connectedNodes, collect(this) as parentNodes
            		UNWIND parentNodes as this
            		UNWIND connectedNodes as this_connect_interface0_node
            		MERGE (this)-[:HAS_INTERFACE]->(this_connect_interface0_node)
            		RETURN count(*)
            	}
            	RETURN count(*) AS connect_this_connect_interface_ChildOne
            }
            CALL {
            		WITH this
            	OPTIONAL MATCH (this_connect_interface0_node:ChildTwo)
            	WHERE this_connect_interface0_node.name = $this_connect_interface0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_interface0_node) as connectedNodes, collect(this) as parentNodes
            		UNWIND parentNodes as this
            		UNWIND connectedNodes as this_connect_interface0_node
            		MERGE (this)-[:HAS_INTERFACE]->(this_connect_interface0_node)
            		RETURN count(*)
            	}
            	RETURN count(*) AS connect_this_connect_interface_ChildTwo
            }
            WITH *
            WITH this
            CALL {
                WITH this
                MATCH (this)-[update_this0:HAS_INTERFACE]->(this_ChildOne:\`ChildOne\`)
                RETURN { __resolveType: \\"ChildOne\\", id: this_ChildOne.id, name: this_ChildOne.name } AS this_interface
                UNION
                WITH this
                MATCH (this)-[update_this1:HAS_INTERFACE]->(this_ChildTwo:\`ChildTwo\`)
                RETURN { __resolveType: \\"ChildTwo\\", id: this_ChildTwo.id, name: this_ChildTwo.name } AS this_interface
            }
            RETURN collect(DISTINCT this { .id, interface: this_interface }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"TestId\\",
                \\"this_connect_interface0_node_param0\\": \\"childone name connect\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

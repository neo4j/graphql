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

describe("https://github.com/neo4j/graphql/issues/1430", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Abce {
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

    test("should also return node with no relationship in result set", async () => {
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
            "MATCH (this:Abce)
            WHERE this.id = $this_id
            CALL apoc.util.validate(EXISTS((this)-[:HAS_INTERFACE]->(:ChildOne)),'Relation field \\"%s\\" cannot have more than one node linked',[\\"interface\\"])
            CREATE (this_create_interface_ChildOne0_node_ChildOne:ChildOne)
            SET this_create_interface_ChildOne0_node_ChildOne.id = randomUUID()
            SET this_create_interface_ChildOne0_node_ChildOne.name = $this_create_interface_ChildOne0_node_ChildOne_name
            MERGE (this)-[:HAS_INTERFACE]->(this_create_interface_ChildOne0_node_ChildOne)
            WITH this
            CALL {
            WITH this
            MATCH (this)-[:HAS_INTERFACE]->(this_ChildOne:ChildOne)
            RETURN { __resolveType: \\"ChildOne\\", id: this_ChildOne.id, name: this_ChildOne.name } AS interface
            UNION
            WITH this
            MATCH (this)-[:HAS_INTERFACE]->(this_ChildTwo:ChildTwo)
            RETURN { __resolveType: \\"ChildTwo\\", id: this_ChildTwo.id, name: this_ChildTwo.name } AS interface
            }
            RETURN collect(DISTINCT this { .id, interface: interface }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"TestID\\",
                \\"this_create_interface_ChildOne0_node_ChildOne_name\\": \\"childone name2\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

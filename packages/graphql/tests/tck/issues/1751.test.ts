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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1751", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Organization {
                organizationId: ID! @id
                title: String
                createdAt: DateTime!
                admins: [Admin!]! @relationship(type: "HAS_ADMINISTRATOR", direction: OUT)
            }

            type Admin {
                adminId: ID! @id
                createdAt: DateTime!
                isSuperAdmin: Boolean
                organizations: [Organization!]! @relationship(type: "HAS_ADMINISTRATOR", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should correctly count aggregate connections in a where inside a delete", async () => {
        const query = gql`
            mutation DeleteOrganizations($where: OrganizationWhere, $delete: OrganizationDeleteInput) {
                deleteOrganizations(where: $where, delete: $delete) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const variableValues = {
            where: {
                title: "Google",
            },
            delete: {
                admins: [
                    {
                        where: {
                            node: {
                                organizationsAggregate: {
                                    count: 1,
                                },
                            },
                        },
                    },
                ],
            },
        };

        const result = await translateQuery(neoSchema, query, { variableValues });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Organization\`)
            WHERE this.title = $param0
            WITH this
            OPTIONAL MATCH (this)-[this_admins0_relationship:HAS_ADMINISTRATOR]->(this_admins0:Admin)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this_admins0)<-[aggr_edge:HAS_ADMINISTRATOR]-(aggr_node:Organization)
            RETURN count(aggr_node) = $aggr_count
            \\", { this_admins0: this_admins0, aggr_count: $aggr_count })
            WITH this, collect(DISTINCT this_admins0) AS this_admins0_to_delete
            CALL {
            	WITH this_admins0_to_delete
            	UNWIND this_admins0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Google\\",
                \\"aggr_count\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});

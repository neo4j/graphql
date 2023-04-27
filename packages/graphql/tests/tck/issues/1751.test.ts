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
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_admins0_relationship:\`HAS_ADMINISTRATOR\`]->(this_admins0:Admin)
            CALL {
                WITH this_admins0
                MATCH (this_admins0)<-[this_deleteOrganizations_args_delete_admins0_where_this_admins0this1:\`HAS_ADMINISTRATOR\`]-(this_deleteOrganizations_args_delete_admins0_where_this_admins0this2:\`Organization\`)
                RETURN count(this_deleteOrganizations_args_delete_admins0_where_this_admins0this2) = $this_deleteOrganizations_args_delete_admins0_where_this_admins0param0 AS this_deleteOrganizations_args_delete_admins0_where_this_admins0var0
            }
            WITH *, CASE this_deleteOrganizations_args_delete_admins0_where_this_admins0var0 = true
                WHEN true THEN [ this_admins0_relationship, this_admins0 ]
                ELSE [ NULL, NULL ]
            END AS aggregateWhereFiltervar0
            WITH *, aggregateWhereFiltervar0[0] AS this_admins0_relationship, aggregateWhereFiltervar0[1] AS this_admins0
            WITH this_admins0_relationship, collect(DISTINCT this_admins0) AS this_admins0_to_delete
            CALL {
            	WITH this_admins0_to_delete
            	UNWIND this_admins0_to_delete AS x
            	DETACH DELETE x
            }
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Google\\",
                \\"this_deleteOrganizations\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"admins\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"organizationsAggregate\\": {
                                                \\"count\\": {
                                                    \\"low\\": 1,
                                                    \\"high\\": 0
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"this_deleteOrganizations_args_delete_admins0_where_this_admins0param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});

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

describe("https://github.com/neo4j/graphql/issues/1751", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Organization {
                organizationId: ID! @id @unique
                title: String
                createdAt: DateTime!
                admins: [Admin!]! @relationship(type: "HAS_ADMINISTRATOR", direction: OUT)
            }

            type Admin {
                adminId: ID! @id @unique
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
        const query = /* GraphQL */ `
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
            "MATCH (this:Organization)
            WHERE this.title = $param0
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this0:HAS_ADMINISTRATOR]->(this1:Admin)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:HAS_ADMINISTRATOR]-(this3:Organization)
                    RETURN count(this3) = $param1 AS var4
                }
                WITH *
                WHERE var4 = true
                WITH this0, collect(DISTINCT this1) AS var5
                CALL {
                    WITH var5
                    UNWIND var5 AS var6
                    DETACH DELETE var6
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Google\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});

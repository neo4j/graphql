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
import { createBearerToken } from "../../utils/create-bearer-token";

describe("#601", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type JWT @jwt {
                roles: [String!]!
            }

            interface UploadedDocument @relationshipProperties {
                fileId: ID!
                uploadedAt: DateTime!
            }

            type Document @exclude(operations: [CREATE, UPDATE, DELETE]) {
                id: ID! @id @unique
                stakeholder: Stakeholder! @relationship(type: "REQUIRES", direction: OUT)

                customerContact: CustomerContact!
                    @relationship(type: "UPLOADED", properties: "UploadedDocument", direction: IN)
            }

            extend type Document @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "view" } } }])

            type CustomerContact @exclude(operations: [CREATE, UPDATE, DELETE]) {
                email: String!
                firstname: String!
                lastname: String!
                documents: [Document!]! @relationship(type: "UPLOADED", properties: "UploadedDocument", direction: OUT)
            }

            extend type CustomerContact @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "view" } } }])

            type Stakeholder @exclude(operations: [CREATE, UPDATE, DELETE]) {
                id: ID!
                fields: String!
                documents: [Document!]! @relationship(type: "REQUIRES", direction: OUT)
            }

            extend type Stakeholder @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "view" } } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });
    });

    test("Example 1", async () => {
        const query = gql`
            query Document {
                stakeholders {
                    documents {
                        customerContactConnection {
                            edges {
                                fileId
                                uploadedAt
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Stakeholder)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $param1 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[this0:REQUIRES]->(this1:Document)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $param3 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this1
                    MATCH (this1:Document)<-[this2:UPLOADED]-(this3:CustomerContact)
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $param4 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH { fileId: this2.fileId, uploadedAt: apoc.date.convertFormat(toString(this2.uploadedAt), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var4
                }
                WITH this1 { customerContactConnection: var4 } AS this1
                RETURN collect(this1) AS var5
            }
            RETURN this { documents: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"param1\\": \\"view\\",
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param3\\": \\"view\\",
                \\"param4\\": \\"view\\"
            }"
        `);
    });
});

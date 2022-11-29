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
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("#601", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface UploadedDocument @relationshipProperties {
                fileId: ID!
                uploadedAt: DateTime!
            }

            type Document @exclude(operations: [CREATE, UPDATE, DELETE]) {
                id: ID! @id
                stakeholder: Stakeholder! @relationship(type: "REQUIRES", direction: OUT)

                customerContact: CustomerContact!
                    @relationship(type: "UPLOADED", properties: "UploadedDocument", direction: IN)
            }

            extend type Document @auth(rules: [{ roles: ["view"] }])

            type CustomerContact @exclude(operations: [CREATE, UPDATE, DELETE]) {
                email: String!
                firstname: String!
                lastname: String!
                documents: [Document!]! @relationship(type: "UPLOADED", properties: "UploadedDocument", direction: OUT)
            }

            extend type CustomerContact @auth(rules: [{ roles: ["view"] }])

            type Stakeholder @exclude(operations: [CREATE, UPDATE, DELETE]) {
                id: ID!
                fields: String!
                documents: [Document!]! @relationship(type: "REQUIRES", direction: OUT)
            }

            extend type Stakeholder @auth(rules: [{ roles: ["view"] }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Stakeholder\`)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (any(var1 IN [\\"view\\"] WHERE any(var0 IN $auth.roles WHERE var0 = var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[this2:REQUIRES]->(this_documents:\`Document\`)
                WHERE apoc.util.validatePredicate(NOT (any(var4 IN [\\"view\\"] WHERE any(var3 IN $auth.roles WHERE var3 = var4))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this_documents
                    MATCH (this_documents)<-[this_documents_connection_customerContactConnectionthis0:UPLOADED]-(this_documents_CustomerContact:\`CustomerContact\`)
                    WHERE apoc.util.validatePredicate(NOT (any(this_documents_connection_customerContactConnectionvar2 IN [\\"view\\"] WHERE any(this_documents_connection_customerContactConnectionvar1 IN $auth.roles WHERE this_documents_connection_customerContactConnectionvar1 = this_documents_connection_customerContactConnectionvar2))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH { fileId: this_documents_connection_customerContactConnectionthis0.fileId, uploadedAt: apoc.date.convertFormat(toString(this_documents_connection_customerContactConnectionthis0.uploadedAt), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS this_documents_customerContactConnection
                }
                WITH this_documents { customerContactConnection: this_documents_customerContactConnection } AS this_documents
                RETURN collect(this_documents) AS this_documents
            }
            RETURN this { documents: this_documents } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
            }"
        `);
    });
});

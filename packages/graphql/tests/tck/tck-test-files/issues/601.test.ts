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
import { createJwtRequest } from "../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("#601", () => {
    const secret = "secret";
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

                customerContact: CustomerContact
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
            config: { enableRegex: true, jwt: { secret } },
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
            "MATCH (this:Stakeholder)
            CALL apoc.util.validate(NOT(ANY(r IN [\\"view\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { documents: [ (this)-[:REQUIRES]->(this_documents:Document)  WHERE apoc.util.validatePredicate(NOT(ANY(r IN [\\"view\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) | this_documents { customerContactConnection: apoc.cypher.runFirstColumn(\\"CALL {
            WITH this_documents
            MATCH (this_documents)<-[this_documents_uploaded_relationship:UPLOADED]-(this_documents_customercontact:CustomerContact)
            CALL apoc.util.validate(NOT(ANY(r IN [\\\\\\"view\\\\\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            WITH collect({ fileId: this_documents_uploaded_relationship.fileId, uploadedAt: apoc.date.convertFormat(toString(this_documents_uploaded_relationship.uploadedAt), \\\\\\"iso_zoned_date_time\\\\\\", \\\\\\"iso_offset_date_time\\\\\\") }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS customerContactConnection
            } RETURN customerContactConnection\\", { this_documents: this_documents, auth: $auth }, false) } ] } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                }
            }"
        `);
    });
});

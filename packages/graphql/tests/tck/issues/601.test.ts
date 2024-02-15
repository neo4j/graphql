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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("#601", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type UploadedDocument @relationshipProperties {
                fileId: ID!
                uploadedAt: DateTime!
            }

            type Document @mutation(operations: []) {
                id: ID! @id @unique
                stakeholder: Stakeholder! @relationship(type: "REQUIRES", direction: OUT)

                customerContact: CustomerContact!
                    @relationship(type: "UPLOADED", properties: "UploadedDocument", direction: IN)
            }

            extend type Document @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "view" } } }])

            type CustomerContact @mutation(operations: []) {
                email: String!
                firstname: String!
                lastname: String!
                documents: [Document!]! @relationship(type: "UPLOADED", properties: "UploadedDocument", direction: OUT)
            }

            extend type CustomerContact @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "view" } } }])

            type Stakeholder @mutation(operations: []) {
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
        const query = /* GraphQL */ `
            query Document {
                stakeholders {
                    documents {
                        customerContactConnection {
                            edges {
                                properties {
                                    fileId
                                    uploadedAt
                                }
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
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[this0:REQUIRES]->(this1:Document)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:UPLOADED]-(this3:CustomerContact)
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH collect({ node: this3, relationship: this2 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this3, edge.relationship AS this2
                        RETURN collect({ properties: { fileId: this2.fileId, uploadedAt: apoc.date.convertFormat(toString(this2.uploadedAt), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), __resolveType: \\"UploadedDocument\\" }, node: { __id: id(this3), __resolveType: \\"CustomerContact\\" } }) AS var4
                    }
                    RETURN { edges: var4, totalCount: totalCount } AS var5
                }
                WITH this1 { customerContactConnection: var5 } AS this1
                RETURN collect(this1) AS var6
            }
            RETURN this { documents: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param2\\": \\"view\\",
                \\"param3\\": \\"view\\",
                \\"param4\\": \\"view\\"
            }"
        `);
    });
});

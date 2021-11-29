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
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher Auth Projection", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                id: ID
                name: String
            }

            extend type User {
                id: ID @auth(rules: [{ allow: { id: "$jwt.sub" } }])
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Update Node", async () => {
        const query = gql`
            mutation {
                updateUsers(update: { id: "new-id" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_update_id_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.id = $this_update_id
            RETURN [ metaVal IN [{type: 'Updated', name: 'User', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_id\\": \\"new-id\\",
                \\"this_update_id_auth_allow0_id\\": \\"super_admin\\",
                \\"this_update\\": {
                    \\"id\\": \\"new-id\\"
                },
                \\"this_id_auth_allow0_id\\": \\"super_admin\\"
            }"
        `);
    });

    test("Create Node", async () => {
        const query = gql`
            mutation {
                createUsers(input: [{ id: "id-1" }, { id: "id-2" }]) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:User)
            SET this0.id = $this0_id
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT([ metaVal IN [{type: 'Created', name: 'User', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ]) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            CALL {
            CREATE (this1:User)
            SET this1.id = $this1_id
            RETURN this1, REDUCE(tmp1_this1_mutateMeta = [], tmp2_this1_mutateMeta IN COLLECT([ metaVal IN [{type: 'Created', name: 'User', id: id(this1), properties: this1}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ]) | tmp1_this1_mutateMeta + tmp2_this1_mutateMeta) as this1_mutateMeta
            }
            WITH this0, this1, mutateMeta + this1_mutateMeta as mutateMeta
            CALL apoc.util.validate(NOT(this0.id IS NOT NULL AND this0.id = $projection_id_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT(this1.id IS NOT NULL AND this1.id = $projection_id_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN mutateMeta, this0 { .id } AS this0, this1 { .id } AS this1"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"id-1\\",
                \\"this1_id\\": \\"id-2\\",
                \\"projection_id_auth_allow0_id\\": \\"super_admin\\"
            }"
        `);
    });
});

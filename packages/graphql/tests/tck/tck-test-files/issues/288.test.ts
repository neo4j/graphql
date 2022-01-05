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
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("#288", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type USER {
                USERID: String
                COMPANYID: String
                COMPANY: [COMPANY] @relationship(type: "IS_PART_OF", direction: OUT)
            }

            type COMPANY {
                USERS: [USER] @relationship(type: "IS_PART_OF", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Can create a USER and COMPANYID is populated", async () => {
        const query = gql`
            mutation {
                createUsers(input: { USERID: "userid", COMPANYID: "companyid" }) {
                    users {
                        USERID
                        COMPANYID
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:USER)
            SET this0.USERID = $this0_USERID
            SET this0.COMPANYID = $this0_COMPANYID
            RETURN this0
            }
            RETURN
            this0 { .USERID, .COMPANYID } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_USERID\\": \\"userid\\",
                \\"this0_COMPANYID\\": \\"companyid\\"
            }"
        `);
    });

    test("Can update a USER and COMPANYID is populated", async () => {
        const query = gql`
            mutation {
                updateUsers(where: { USERID: "userid" }, update: { COMPANYID: "companyid2" }) {
                    users {
                        USERID
                        COMPANYID
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:USER)
            WHERE this.USERID = $this_USERID
            SET this.COMPANYID = $this_update_COMPANYID
            RETURN this { .USERID, .COMPANYID } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_USERID\\": \\"userid\\",
                \\"this_update_COMPANYID\\": \\"companyid2\\"
            }"
        `);
    });
});

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

describe("#288", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type USER {
                USERID: String
                COMPANYID: String
                COMPANY: [COMPANY!]! @relationship(type: "IS_PART_OF", direction: OUT)
            }

            type COMPANY {
                USERS: [USER!]! @relationship(type: "IS_PART_OF", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Can create a USER and COMPANYID is populated", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(input: { USERID: "userid", COMPANYID: "companyid" }) {
                    users {
                        USERID
                        COMPANYID
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:USER)
                SET
                    create_this1.USERID = create_var0.USERID,
                    create_this1.COMPANYID = create_var0.COMPANYID
                RETURN create_this1
            }
            RETURN collect(create_this1 { .USERID, .COMPANYID }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"USERID\\": \\"userid\\",
                        \\"COMPANYID\\": \\"companyid\\"
                    }
                ]
            }"
        `);
    });

    test("Can update a USER and COMPANYID is populated", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(where: { USERID: "userid" }, update: { COMPANYID: "companyid2" }) {
                    users {
                        USERID
                        COMPANYID
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:USER)
            WHERE this.USERID = $param0
            SET this.COMPANYID = $this_update_COMPANYID
            RETURN collect(DISTINCT this { .USERID, .COMPANYID }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"userid\\",
                \\"this_update_COMPANYID\\": \\"companyid2\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

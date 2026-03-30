/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("#288", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type USER @node {
                USERID: String
                COMPANYID: String
                COMPANY: [COMPANY!]! @relationship(type: "IS_PART_OF", direction: OUT)
            }

            type COMPANY @node {
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
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
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
                updateUsers(where: { USERID: { eq: "userid" } }, update: { COMPANYID_SET: "companyid2" }) {
                    users {
                        USERID
                        COMPANYID
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:USER)
            WITH *
            WHERE this.USERID = $param0
            SET this.COMPANYID = $param1
            WITH this
            RETURN this { .USERID, .COMPANYID } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"userid\\",
                \\"param1\\": \\"companyid2\\"
            }"
        `);
    });
});

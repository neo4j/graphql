/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("#190", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                client_id: String
                uid: String
                demographics: [UserDemographics!]! @relationship(type: "HAS_DEMOGRAPHIC", direction: OUT)
            }

            type UserDemographics @node {
                client_id: String
                type: String
                value: String
                users: [User!]! @relationship(type: "HAS_DEMOGRAPHIC", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Example 1", async () => {
        const query = /* GraphQL */ `
            query {
                users(where: { demographics: { some: { type: { eq: "Gender" }, value: { eq: "Female" } } } }) {
                    uid
                    demographics {
                        type
                        value
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WHERE EXISTS {
              MATCH (this)-[:HAS_DEMOGRAPHIC]->(this0:UserDemographics)
              WHERE (this0.type = $param0 AND this0.value = $param1)
            }
            CALL (this) {
              MATCH (this)-[this1:HAS_DEMOGRAPHIC]->(this2:UserDemographics)
              WITH DISTINCT this2
              WITH this2 { .type, .value } AS this2
              RETURN collect(this2) AS var3
            }
            RETURN this { .uid, demographics: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Gender\\",
                \\"param1\\": \\"Female\\"
            }"
        `);
    });

    test("Example 2", async () => {
        const query = /* GraphQL */ `
            query {
                users(
                    where: {
                        demographics: {
                            some: {
                                OR: [
                                    { type: { eq: "Gender" }, value: { eq: "Female" } }
                                    { type: { eq: "State" } }
                                    { type: { eq: "Age" } }
                                ]
                            }
                        }
                    }
                ) {
                    uid
                    demographics {
                        type
                        value
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WHERE EXISTS {
              MATCH (this)-[:HAS_DEMOGRAPHIC]->(this0:UserDemographics)
              WHERE ((this0.type = $param0 AND this0.value = $param1) OR this0.type = $param2 OR this0.type = $param3)
            }
            CALL (this) {
              MATCH (this)-[this1:HAS_DEMOGRAPHIC]->(this2:UserDemographics)
              WITH DISTINCT this2
              WITH this2 { .type, .value } AS this2
              RETURN collect(this2) AS var3
            }
            RETURN this { .uid, demographics: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Gender\\",
                \\"param1\\": \\"Female\\",
                \\"param2\\": \\"State\\",
                \\"param3\\": \\"Age\\"
            }"
        `);
    });
});

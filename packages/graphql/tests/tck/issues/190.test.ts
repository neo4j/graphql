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

describe("#190", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User {
                client_id: String
                uid: String
                demographics: [UserDemographics!]! @relationship(type: "HAS_DEMOGRAPHIC", direction: OUT)
            }

            type UserDemographics {
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
                users(where: { demographics: { type: "Gender", value: "Female" } }) {
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
            "MATCH (this:User)
            WHERE EXISTS {
                MATCH (this)-[:HAS_DEMOGRAPHIC]->(this0:UserDemographics)
                WHERE (this0.type = $param0 AND this0.value = $param1)
            }
            CALL {
                WITH this
                MATCH (this)-[this1:HAS_DEMOGRAPHIC]->(this2:UserDemographics)
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
                        demographics: { OR: [{ type: "Gender", value: "Female" }, { type: "State" }, { type: "Age" }] }
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
            "MATCH (this:User)
            WHERE EXISTS {
                MATCH (this)-[:HAS_DEMOGRAPHIC]->(this0:UserDemographics)
                WHERE ((this0.type = $param0 AND this0.value = $param1) OR this0.type = $param2 OR this0.type = $param3)
            }
            CALL {
                WITH this
                MATCH (this)-[this1:HAS_DEMOGRAPHIC]->(this2:UserDemographics)
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

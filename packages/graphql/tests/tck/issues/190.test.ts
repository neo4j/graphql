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

describe("#190", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
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
            config: { enableRegex: true },
        });
    });

    test("Example 1", async () => {
        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WHERE EXISTS {
                MATCH (this)-[this0:HAS_DEMOGRAPHIC]->(this1:\`UserDemographics\`)
                WHERE (this1.type = $param0 AND this1.value = $param1)
            }
            CALL {
                WITH this
                MATCH (this)-[this2:HAS_DEMOGRAPHIC]->(this_demographics:\`UserDemographics\`)
                WITH this_demographics { .type, .value } AS this_demographics
                RETURN collect(this_demographics) AS this_demographics
            }
            RETURN this { .uid, demographics: this_demographics } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Gender\\",
                \\"param1\\": \\"Female\\"
            }"
        `);
    });

    test("Example 2", async () => {
        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WHERE EXISTS {
                MATCH (this)-[this0:HAS_DEMOGRAPHIC]->(this1:\`UserDemographics\`)
                WHERE ((this1.type = $param0 AND this1.value = $param1) OR this1.type = $param2 OR this1.type = $param3)
            }
            CALL {
                WITH this
                MATCH (this)-[this2:HAS_DEMOGRAPHIC]->(this_demographics:\`UserDemographics\`)
                WITH this_demographics { .type, .value } AS this_demographics
                RETURN collect(this_demographics) AS this_demographics
            }
            RETURN this { .uid, demographics: this_demographics } AS this"
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

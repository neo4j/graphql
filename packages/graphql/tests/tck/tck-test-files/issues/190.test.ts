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

describe("#190", () => {
    const secret = "secret";
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
            config: { enableRegex: true, jwt: { secret } },
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
            "MATCH (this:User)
            WHERE EXISTS((this)-[:HAS_DEMOGRAPHIC]->(:UserDemographics)) AND ANY(this_demographics IN [(this)-[:HAS_DEMOGRAPHIC]->(this_demographics:UserDemographics) | this_demographics] WHERE this_demographics.type = $this_demographics_type AND this_demographics.value = $this_demographics_value)
            RETURN this { .uid, demographics: [ (this)-[:HAS_DEMOGRAPHIC]->(this_demographics:UserDemographics)   | this_demographics { .type, .value } ] } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_demographics_type\\": \\"Gender\\",
                \\"this_demographics_value\\": \\"Female\\"
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
            "MATCH (this:User)
            WHERE EXISTS((this)-[:HAS_DEMOGRAPHIC]->(:UserDemographics)) AND ANY(this_demographics IN [(this)-[:HAS_DEMOGRAPHIC]->(this_demographics:UserDemographics) | this_demographics] WHERE (this_demographics.type = $this_demographics_OR_type AND this_demographics.value = $this_demographics_OR_value OR this_demographics.type = $this_demographics_OR1_type OR this_demographics.type = $this_demographics_OR2_type))
            RETURN this { .uid, demographics: [ (this)-[:HAS_DEMOGRAPHIC]->(this_demographics:UserDemographics)   | this_demographics { .type, .value } ] } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_demographics_OR_type\\": \\"Gender\\",
                \\"this_demographics_OR_value\\": \\"Female\\",
                \\"this_demographics_OR1_type\\": \\"State\\",
                \\"this_demographics_OR2_type\\": \\"Age\\"
            }"
        `);
    });
});

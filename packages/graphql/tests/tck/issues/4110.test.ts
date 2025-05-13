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
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4110", () => {
    const secret = "sssh!";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Company
                @authorization(
                    filter: [{ operations: [READ], where: { node: { inBetween: { company: { id: "example" } } } } }]
                ) {
                id: ID @id
                inBetween: InBetween @relationship(type: "CONNECT_TO", direction: OUT)
            }
            type InBetween {
                id: ID @id
                company: Company! @relationship(type: "CONNECT_TO", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("wrap authenticated subquery on top level read operation", async () => {
        const query = /* GraphQL */ `
            query {
                companies {
                    inBetween {
                        company {
                            id
                        }
                    }
                }
            }
        `;
        const token = createBearerToken(secret, { sub: "michel", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Company)
            WITH *
            WHERE ($isAuthenticated = true AND single(this1 IN [(this)-[:CONNECT_TO]->(this1:InBetween) WHERE size([(this1)<-[:CONNECT_TO]-(this0:Company) WHERE ($param1 IS NOT NULL AND this0.id = $param1) | 1]) > 0 | 1] WHERE true))
            CALL {
                WITH this
                MATCH (this)-[this2:CONNECT_TO]->(this3:InBetween)
                CALL {
                    WITH this3
                    MATCH (this3)<-[this4:CONNECT_TO]-(this5:Company)
                    WITH *
                    WHERE ($isAuthenticated = true AND single(this7 IN [(this5)-[:CONNECT_TO]->(this7:InBetween) WHERE size([(this7)<-[:CONNECT_TO]-(this6:Company) WHERE ($param2 IS NOT NULL AND this6.id = $param2) | 1]) > 0 | 1] WHERE true))
                    WITH this5 { .id } AS this5
                    RETURN head(collect(this5)) AS var8
                }
                WITH this3 { company: var8 } AS this3
                RETURN head(collect(this3)) AS var9
            }
            RETURN this { inBetween: var9 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"param1\\": \\"example\\",
                \\"param2\\": \\"example\\"
            }"
        `);
    });
});

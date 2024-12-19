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
            CALL {
                WITH this
                MATCH (this)-[:CONNECT_TO]->(this0:InBetween)
                OPTIONAL MATCH (this0)<-[:CONNECT_TO]-(this1:Company)
                WITH *, count(this1) AS var2
                WITH *
                WHERE (var2 <> 0 AND ($param0 IS NOT NULL AND this1.id = $param0))
                RETURN count(this0) = 1 AS var3
            }
            WITH *
            WHERE ($isAuthenticated = true AND var3 = true)
            CALL {
                WITH this
                MATCH (this)-[this4:CONNECT_TO]->(this5:InBetween)
                CALL {
                    WITH this5
                    MATCH (this5)<-[this6:CONNECT_TO]-(this7:Company)
                    CALL {
                        WITH this7
                        MATCH (this7)-[:CONNECT_TO]->(this8:InBetween)
                        OPTIONAL MATCH (this8)<-[:CONNECT_TO]-(this9:Company)
                        WITH *, count(this9) AS var10
                        WITH *
                        WHERE (var10 <> 0 AND ($param2 IS NOT NULL AND this9.id = $param2))
                        RETURN count(this8) = 1 AS var11
                    }
                    WITH *
                    WHERE ($isAuthenticated = true AND var11 = true)
                    WITH this7 { .id } AS this7
                    RETURN head(collect(this7)) AS var12
                }
                WITH this5 { company: var12 } AS this5
                RETURN head(collect(this5)) AS var13
            }
            RETURN this { inBetween: var13 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"example\\",
                \\"isAuthenticated\\": true,
                \\"param2\\": \\"example\\"
            }"
        `);
    });
});

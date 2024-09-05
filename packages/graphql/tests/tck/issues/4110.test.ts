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
                @node
                @authorization(
                    filter: [{ operations: [READ], where: { node: { inBetween: { company: { id: "example" } } } } }]
                ) {
                id: ID @id
                inBetween: InBetween @relationship(type: "CONNECT_TO", direction: OUT)
            }
            type InBetween @node {
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
                WITH *, count(this1) AS companyCount
                WITH *
                WHERE (companyCount <> 0 AND ($param0 IS NOT NULL AND this1.id = $param0))
                RETURN count(this0) = 1 AS var2
            }
            WITH *
            WHERE ($isAuthenticated = true AND var2 = true)
            CALL {
                WITH this
                MATCH (this)-[this3:CONNECT_TO]->(this4:InBetween)
                CALL {
                    WITH this4
                    MATCH (this4)<-[this5:CONNECT_TO]-(this6:Company)
                    CALL {
                        WITH this6
                        MATCH (this6)-[:CONNECT_TO]->(this7:InBetween)
                        OPTIONAL MATCH (this7)<-[:CONNECT_TO]-(this8:Company)
                        WITH *, count(this8) AS companyCount
                        WITH *
                        WHERE (companyCount <> 0 AND ($param2 IS NOT NULL AND this8.id = $param2))
                        RETURN count(this7) = 1 AS var9
                    }
                    WITH *
                    WHERE ($isAuthenticated = true AND var9 = true)
                    WITH this6 { .id } AS this6
                    RETURN head(collect(this6)) AS var10
                }
                WITH this4 { company: var10 } AS this4
                RETURN head(collect(this4)) AS var11
            }
            RETURN this { inBetween: var11 } AS this"
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

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

import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Interface top level operations", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = gql`
            interface Show {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Show @limit(default: 3, max: 10) {
                title: String!
                cost: Float
                runtime: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Show {
                title: String!
                episodes: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor {
                name: String!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
            experimental: true,
        });
    });

    test("Logical operator filter (top level)", async () => {
        const query = gql`
            query actedInWhere {
                shows(where: { OR: [{ title: "The Office" }, { title: "The Office 2" }] }) {
                    title
                }
            }
        `;

        const token = createBearerToken(secret);
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE (this0.title = $param0 OR this0.title = $param1)
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:Series)
                WHERE (this1.title = $param2 OR this1.title = $param3)
                WITH this1 { .title, __resolveType: \\"Series\\", __id: id(this1) } AS this1
                RETURN this1 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Office\\",
                \\"param1\\": \\"The Office 2\\",
                \\"param2\\": \\"The Office\\",
                \\"param3\\": \\"The Office 2\\"
            }"
        `);
    });

    test("Logical operator filter on relationship", async () => {
        const query = gql`
            query actedInWhere {
                actors {
                    actedIn(where: { OR: [{ title: "The Office" }, { title: "The Office 2" }] }) {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken(secret);
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WHERE (this1.title = $param0 OR this1.title = $param1)
                    WITH this1 { .title, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    WHERE (this4.title = $param2 OR this4.title = $param3)
                    WITH this4 { .title, __resolveType: \\"Series\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Office\\",
                \\"param1\\": \\"The Office 2\\",
                \\"param2\\": \\"The Office\\",
                \\"param3\\": \\"The Office 2\\"
            }"
        `);
    });
});

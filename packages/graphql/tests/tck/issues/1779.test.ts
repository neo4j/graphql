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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1779", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Person {
                name: String
                age: Int
                attends: [School!]! @relationship(type: "attends", direction: OUT)
            }

            type School {
                name: String
                students: [Person!]! @relationship(type: "attends", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("EXISTS should not be within return clause", async () => {
        const query = gql`
            {
                people {
                    name
                    attends(where: { students_ALL: { age_GT: 23 } }) {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Person\`)
            CALL {
                WITH this
                MATCH (this)-[this0:attends]->(this1:\`School\`)
                WHERE (EXISTS {
                    MATCH (this1)<-[:attends]-(this2:\`Person\`)
                    WHERE this2.age > $param0
                } AND NOT (EXISTS {
                    MATCH (this1)<-[:attends]-(this2:\`Person\`)
                    WHERE NOT (this2.age > $param0)
                }))
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var3
            }
            RETURN this { .name, attends: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 23,
                    \\"high\\": 0
                }
            }"
        `);
    });
});

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
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Field Level Aggregations Where", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                directors: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                released: DateTime
            }

            type Person {
                name: String
                age: Int
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Count aggregation with number filter", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsAggregate(where: { age_GT: 40 }) {
                        count
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this_actorsAggregate_this1:\`Person\`)-[this_actorsAggregate_this0:ACTED_IN]->(this)
                WHERE this_actorsAggregate_this1.age > $this_actorsAggregate_param0
                RETURN count(this_actorsAggregate_this1) AS this_actorsAggregate_var2
            }
            RETURN this { .title, actorsAggregate: { count: this_actorsAggregate_var2 } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorsAggregate_param0\\": {
                    \\"low\\": 40,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Count aggregation with colliding filter", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsAggregate(where: { name_CONTAINS: "abc" }) {
                        count
                    }
                    directorsAggregate(where: { name_CONTAINS: "abcdefg" }) {
                        count
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this_actorsAggregate_this1:\`Person\`)-[this_actorsAggregate_this0:ACTED_IN]->(this)
                WHERE this_actorsAggregate_this1.name CONTAINS $this_actorsAggregate_param0
                RETURN count(this_actorsAggregate_this1) AS this_actorsAggregate_var2
            }
            CALL {
                WITH this
                MATCH (this_directorsAggregate_this1:\`Person\`)-[this_directorsAggregate_this0:DIRECTED]->(this)
                WHERE this_directorsAggregate_this1.name CONTAINS $this_directorsAggregate_param0
                RETURN count(this_directorsAggregate_this1) AS this_directorsAggregate_var2
            }
            RETURN this { .title, actorsAggregate: { count: this_actorsAggregate_var2 }, directorsAggregate: { count: this_directorsAggregate_var2 } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorsAggregate_param0\\": \\"abc\\",
                \\"this_directorsAggregate_param0\\": \\"abcdefg\\"
            }"
        `);
    });
});

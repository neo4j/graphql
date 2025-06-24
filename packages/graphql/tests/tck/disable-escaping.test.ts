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

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Disable escaping", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String!
            }

            type Movie @node(labels: ["Movie:Film"]) {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN|PATICIPATED", direction: IN)
            }
        `;
    });

    test("disableRelationshipTypeEscaping", async () => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                unsafeEscapeOptions: {
                    disableRelationshipTypeEscaping: true,
                },
            },
        });
        const query = /* GraphQL */ `
            {
                movies {
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:\`Movie:Film\`)
            CALL (this) {
                MATCH (this)<-[this0:ACTED_IN|PATICIPATED]-(this1:Actor)
                WITH DISTINCT this1
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var2
            }
            RETURN this { actors: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("disableNodeLabelEscaping", async () => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                unsafeEscapeOptions: {
                    disableNodeLabelEscaping: true,
                },
            },
        });
        const query = /* GraphQL */ `
            {
                movies {
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie:Film)
            CALL (this) {
                MATCH (this)<-[this0:\`ACTED_IN|PATICIPATED\`]-(this1:Actor)
                WITH DISTINCT this1
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var2
            }
            RETURN this { actors: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});

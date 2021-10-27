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
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher LocalDateTime", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                id: ID
                localDT: LocalDateTime
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Simple Read", async () => {
        const query = gql`
            query {
                movies(where: { localDT: "2003-09-14T12:00:00" }) {
                    localDT
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.localDT = $this_localDT
            RETURN this { .localDT } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_localDT\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("GTE Read", async () => {
        const query = gql`
            query {
                movies(where: { localDT_GTE: "2010-08-23T13:45:33.250" }) {
                    localDT
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.localDT >= $this_localDT_GTE
            RETURN this { .localDT } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_localDT_GTE\\": {
                    \\"year\\": 2010,
                    \\"month\\": 8,
                    \\"day\\": 23,
                    \\"hour\\": 13,
                    \\"minute\\": 45,
                    \\"second\\": 33,
                    \\"nanosecond\\": 250000000
                }
            }"
        `);
    });

    test("Simple Create", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ localDT: "1974-05-01T22:00:15.555" }]) {
                    movies {
                        localDT
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Movie)
            SET this0.localDT = $this0_localDT
            RETURN this0
            }
            RETURN
            this0 { .localDT } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_localDT\\": {
                    \\"year\\": 1974,
                    \\"month\\": 5,
                    \\"day\\": 1,
                    \\"hour\\": 22,
                    \\"minute\\": 0,
                    \\"second\\": 15,
                    \\"nanosecond\\": 555000000
                }
            }"
        `);
    });

    test("Simple Update", async () => {
        const query = gql`
            mutation {
                updateMovies(update: { localDT: "1881-07-13T09:24:40.845512" }) {
                    movies {
                        id
                        localDT
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            SET this.localDT = $this_update_localDT
            RETURN this { .id, .localDT } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_localDT\\": {
                    \\"year\\": 1881,
                    \\"month\\": 7,
                    \\"day\\": 13,
                    \\"hour\\": 9,
                    \\"minute\\": 24,
                    \\"second\\": 40,
                    \\"nanosecond\\": 845512000
                }
            }"
        `);
    });
});

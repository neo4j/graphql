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
import { createJwtRequest } from "../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher Date", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                id: ID
                date: Date
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
                movies(where: { date: "1970-01-01" }) {
                    date
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.date = $this_date
            RETURN this { .date } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_date\\": {
                    \\"year\\": 1970,
                    \\"month\\": 1,
                    \\"day\\": 1
                }
            }"
        `);
    });

    test("GTE Read", async () => {
        const query = gql`
            query {
                movies(where: { date_GTE: "1980-04-08" }) {
                    date
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.date >= $this_date_GTE
            RETURN this { .date } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_date_GTE\\": {
                    \\"year\\": 1980,
                    \\"month\\": 4,
                    \\"day\\": 8
                }
            }"
        `);
    });

    test("Simple Create", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ date: "1970-01-01" }]) {
                    movies {
                        date
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
            SET this0.date = $this0_date
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT([ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ]) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .date } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_date\\": {
                    \\"year\\": 1970,
                    \\"month\\": 1,
                    \\"day\\": 1
                }
            }"
        `);
    });

    test("Simple Update", async () => {
        const query = gql`
            mutation {
                updateMovies(update: { date: "1970-01-01" }) {
                    movies {
                        id
                        date
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
            SET this.date = $this_update_date
            RETURN [ metaVal IN [{type: 'Updated', name: 'Movie', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta, this { .id, .date } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_date\\": {
                    \\"year\\": 1970,
                    \\"month\\": 1,
                    \\"day\\": 1
                },
                \\"this_update\\": {
                    \\"date\\": {
                        \\"year\\": 1970,
                        \\"month\\": 1,
                        \\"day\\": 1
                    }
                }
            }"
        `);
    });
});

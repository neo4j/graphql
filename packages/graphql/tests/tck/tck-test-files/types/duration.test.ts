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

describe("Cypher Duration", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                id: ID
                duration: Duration
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
                movies(where: { duration: "P1Y" }) {
                    duration
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.duration = $this_duration
            RETURN this { .duration } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_duration\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("GTE Read", async () => {
        const query = gql`
            query {
                movies(where: { duration_GTE: "P3Y4M" }) {
                    duration
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE datetime() + this.duration >= datetime() + $this_duration_GTE
            RETURN this { .duration } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_duration_GTE\\": {
                    \\"months\\": 40,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("Simple Create", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ duration: "P2Y" }]) {
                    movies {
                        duration
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
            SET this0.duration = $this0_duration
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT([ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ]) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .duration } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_duration\\": {
                    \\"months\\": 24,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("Simple Update", async () => {
        const query = gql`
            mutation {
                updateMovies(update: { duration: "P4D" }) {
                    movies {
                        id
                        duration
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
            SET this.duration = $this_update_duration
            RETURN [ metaVal IN [{type: 'Updated', name: 'Movie', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta, this { .id, .duration } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_duration\\": {
                    \\"months\\": 0,
                    \\"days\\": 4,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                },
                \\"this_update\\": {
                    \\"duration\\": {
                        \\"months\\": 0,
                        \\"days\\": 4,
                        \\"seconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        },
                        \\"nanoseconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        }
                    }
                }
            }"
        `);
    });
});

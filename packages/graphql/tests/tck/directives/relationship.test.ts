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
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher relationship", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            interface MovieInterface {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Movie implements MovieInterface {
                id: ID
                title: String
                actors: [Actor!]!
                topActor: Actor! @relationship(type: "TOP_ACTOR", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Simple relation", async () => {
        const query = gql`
            {
                movies {
                    title
                    topActor {
                        name
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
                MATCH (this)-[this0:\`TOP_ACTOR\`]->(this1:\`Actor\`)
                WITH this1 { .name } AS this1
                RETURN head(collect(this1)) AS var2
            }
            RETURN this { .title, topActor: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Many relation", async () => {
        const query = gql`
            {
                movies {
                    title
                    actors {
                        name
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
                MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var2
            }
            RETURN this { .title, actors: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested relation", async () => {
        const query = gql`
            {
                movies {
                    title
                    topActor {
                        name
                        movies {
                            title
                        }
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
                MATCH (this)-[this0:\`TOP_ACTOR\`]->(this1:\`Actor\`)
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:\`ACTED_IN\`]->(this3:\`Movie\`)
                    WITH this3 { .title } AS this3
                    RETURN collect(this3) AS var4
                }
                WITH this1 { .name, movies: var4 } AS this1
                RETURN head(collect(this1)) AS var5
            }
            RETURN this { .title, topActor: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested relation with params", async () => {
        const query = gql`
            {
                movies(where: { title: "some title" }) {
                    title
                    topActor(where: { name: "top actor" }) {
                        name
                        movies(where: { title: "top actor movie" }) {
                            title
                        }
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
            WHERE this.\`title\` = $param0
            CALL {
                WITH this
                MATCH (this)-[this0:\`TOP_ACTOR\`]->(this1:\`Actor\`)
                WHERE this1.\`name\` = $param1
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:\`ACTED_IN\`]->(this3:\`Movie\`)
                    WHERE this3.\`title\` = $param2
                    WITH this3 { .title } AS this3
                    RETURN collect(this3) AS var4
                }
                WITH this1 { .name, movies: var4 } AS this1
                RETURN head(collect(this1)) AS var5
            }
            RETURN this { .title, topActor: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": \\"top actor\\",
                \\"param2\\": \\"top actor movie\\"
            }"
        `);
    });
});

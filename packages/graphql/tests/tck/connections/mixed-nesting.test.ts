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

describe("Mixed nesting", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Connection -> Relationship", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(where: { node: { name: "Tom Hanks" } }) {
                        edges {
                            screenTime
                            node {
                                name
                                movies(where: { title_NOT: "Forrest Gump" }) {
                                    title
                                }
                            }
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
                MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                WHERE this1.\`name\` = $param1
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:\`ACTED_IN\`]->(this3:\`Movie\`)
                    WHERE NOT (this3.\`title\` = $param2)
                    WITH this3 { .title } AS this3
                    RETURN collect(this3) AS var4
                }
                WITH { screenTime: this0.\`screenTime\`, node: { name: this1.\`name\`, movies: var4 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var5
            }
            RETURN this { .title, actorsConnection: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\",
                \\"param2\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Connection -> Connection -> Relationship", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(where: { node: { name: "Tom Hanks" } }) {
                        edges {
                            screenTime
                            node {
                                name
                                moviesConnection(where: { node: { title_NOT: "Forrest Gump" } }) {
                                    edges {
                                        node {
                                            title
                                            actors(where: { name_NOT: "Tom Hanks" }) {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
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
                MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                WHERE this1.\`name\` = $param1
                CALL {
                    WITH this1
                    MATCH (this1:\`Actor\`)-[this2:\`ACTED_IN\`]->(this3:\`Movie\`)
                    WHERE NOT (this3.\`title\` = $param2)
                    CALL {
                        WITH this3
                        MATCH (this3)<-[this4:\`ACTED_IN\`]-(this5:\`Actor\`)
                        WHERE NOT (this5.\`name\` = $param3)
                        WITH this5 { .name } AS this5
                        RETURN collect(this5) AS var6
                    }
                    WITH { node: { title: this3.\`title\`, actors: var6 } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var7
                }
                WITH { screenTime: this0.\`screenTime\`, node: { name: this1.\`name\`, moviesConnection: var7 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var8
            }
            RETURN this { .title, actorsConnection: var8 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\",
                \\"param2\\": \\"Forrest Gump\\",
                \\"param3\\": \\"Tom Hanks\\"
            }"
        `);
    });

    test("Relationship -> Connection", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actors(where: { name: "Tom Hanks" }) {
                        name
                        moviesConnection(where: { node: { title_NOT: "Forrest Gump" } }) {
                            edges {
                                screenTime
                                node {
                                    title
                                }
                            }
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
                MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                WHERE this1.\`name\` = $param1
                CALL {
                    WITH this1
                    MATCH (this1:\`Actor\`)-[this2:\`ACTED_IN\`]->(this3:\`Movie\`)
                    WHERE NOT (this3.\`title\` = $param2)
                    WITH { screenTime: this2.\`screenTime\`, node: { title: this3.\`title\` } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var4
                }
                WITH this1 { .name, moviesConnection: var4 } AS this1
                RETURN collect(this1) AS var5
            }
            RETURN this { .title, actors: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\",
                \\"param2\\": \\"Forrest Gump\\"
            }"
        `);
    });
});

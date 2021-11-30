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
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Relay Cursor Connection projections", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            union Production = Movie | Series

            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Series {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                productions: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("edges not returned if not asked for", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection {
                        totalCount
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
            WHERE this.title = $this_title
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WITH collect({  }) AS edges
            RETURN { totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("edges and totalCount returned if pageInfo asked for", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection {
                        pageInfo {
                            startCursor
                            endCursor
                            hasNextPage
                            hasPreviousPage
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WITH collect({  }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Minimal edges returned if not asked for with pagination arguments", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(first: 5) {
                        totalCount
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
            WHERE this.title = $this_title
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WITH collect({  }) AS edges
            WITH size(edges) AS totalCount, edges[..5] AS limitedSelection
            RETURN { edges: limitedSelection, totalCount: totalCount } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("edges not returned if not asked for on a union", async () => {
        const query = gql`
            query {
                actors(where: { name: "Tom Hanks" }) {
                    name
                    productionsConnection {
                        totalCount
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $this_name
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Movie:Movie)
            WITH { node: { __resolveType: \\"Movie\\" } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
            WITH { node: { __resolveType: \\"Series\\" } } AS edge
            RETURN edge
            }
            WITH count(edge) as totalCount
            RETURN { totalCount: totalCount } AS productionsConnection
            }
            RETURN this { .name, productionsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_name\\": \\"Tom Hanks\\"
            }"
        `);
    });

    test("edges and totalCount returned if pageInfo asked for on a union", async () => {
        const query = gql`
            query {
                actors(where: { name: "Tom Hanks" }) {
                    name
                    productionsConnection {
                        pageInfo {
                            startCursor
                            endCursor
                            hasNextPage
                            hasPreviousPage
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
            "MATCH (this:Actor)
            WHERE this.name = $this_name
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Movie:Movie)
            WITH { node: { __resolveType: \\"Movie\\" } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
            WITH { node: { __resolveType: \\"Series\\" } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: totalCount } AS productionsConnection
            }
            RETURN this { .name, productionsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_name\\": \\"Tom Hanks\\"
            }"
        `);
    });

    test("totalCount is calculated and returned if asked for with edges", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection {
                        totalCount
                        edges {
                            node {
                                name
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WITH collect({ node: { name: this_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("totalCount is calculated and returned if asked for with edges with pagination arguments", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(first: 5) {
                        totalCount
                        edges {
                            node {
                                name
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WITH collect({ node: { name: this_actor.name } }) AS edges
            WITH size(edges) AS totalCount, edges[..5] AS limitedSelection
            RETURN { edges: limitedSelection, totalCount: totalCount } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\"
            }"
        `);
    });
});

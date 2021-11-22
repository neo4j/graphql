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

describe("Cypher -> Connections -> Interfaces", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Production {
                title: String!
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                episodes: Int!
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Projecting interface node and relationship properties with no arguments", async () => {
        const query = gql`
            query {
                actors {
                    name
                    actedInConnection {
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
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
            "MATCH (this:Actor)
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Movie:Movie)
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
            }
            RETURN this { .name, actedInConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Projecting interface node and relationship properties with common where argument", async () => {
        const query = gql`
            query {
                actors {
                    name
                    actedInConnection(where: { node: { title_STARTS_WITH: "The " } }) {
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
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
            "MATCH (this:Actor)
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Movie:Movie)
            WHERE this_Movie.title STARTS WITH $this_actedInConnection.args.where.node.title_STARTS_WITH
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
            WHERE this_Series.title STARTS WITH $this_actedInConnection.args.where.node.title_STARTS_WITH
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
            }
            RETURN this { .name, actedInConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actedInConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"title_STARTS_WITH\\": \\"The \\"
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Projecting interface node and relationship properties with where argument", async () => {
        const query = gql`
            query {
                actors {
                    name
                    actedInConnection(
                        where: { node: { _on: { Movie: { runtime_GT: 90 }, Series: { episodes_GT: 50 } } } }
                    ) {
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
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
            "MATCH (this:Actor)
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Movie:Movie)
            WHERE this_Movie.runtime > $this_actedInConnection.args.where.node._on.Movie.runtime_GT
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
            WHERE this_Series.episodes > $this_actedInConnection.args.where.node._on.Series.episodes_GT
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
            }
            RETURN this { .name, actedInConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actedInConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"_on\\": {
                                    \\"Movie\\": {
                                        \\"runtime_GT\\": {
                                            \\"low\\": 90,
                                            \\"high\\": 0
                                        }
                                    },
                                    \\"Series\\": {
                                        \\"episodes_GT\\": {
                                            \\"low\\": 50,
                                            \\"high\\": 0
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Projecting interface node and relationship properties with where relationship argument", async () => {
        const query = gql`
            query {
                actors {
                    name
                    actedInConnection(where: { edge: { screenTime_GT: 60 } }) {
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
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
            "MATCH (this:Actor)
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Movie:Movie)
            WHERE this_acted_in_relationship.screenTime > $this_actedInConnection.args.where.edge.screenTime_GT
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
            WHERE this_acted_in_relationship.screenTime > $this_actedInConnection.args.where.edge.screenTime_GT
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
            }
            RETURN this { .name, actedInConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actedInConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"edge\\": {
                                \\"screenTime_GT\\": {
                                    \\"low\\": 60,
                                    \\"high\\": 0
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Projecting interface node and relationship properties with sort argument", async () => {
        const query = gql`
            query {
                actors {
                    name
                    actedInConnection(sort: [{ edge: { screenTime: ASC } }]) {
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
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
            "MATCH (this:Actor)
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Movie:Movie)
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
            RETURN edge
            }
            WITH edge ORDER BY edge.screenTime ASC
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
            }
            RETURN this { .name, actedInConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});

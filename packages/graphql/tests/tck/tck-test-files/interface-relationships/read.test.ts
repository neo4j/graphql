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
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Interface Relationships", () => {
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
                currentlyActingIn: Production @relationship(type: "CURRENTLY_ACTING_IN", direction: OUT)
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Simple Interface Relationship Query", async () => {
        const query = gql`
            query {
                actors {
                    actedIn {
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
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH this
            CALL {
            WITH this
            MATCH (this)-[:ACTED_IN]->(this_Movie:Movie)
            RETURN { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } AS actedIn
            UNION
            WITH this
            MATCH (this)-[:ACTED_IN]->(this_Series:Series)
            RETURN { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } AS actedIn
            }
            RETURN this { actedIn: collect(actedIn) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Simple Interface Relationship Query For Non-Array Field", async () => {
        const query = gql`
            query {
                actors {
                    currentlyActingIn {
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
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH this
            CALL {
            WITH this
            MATCH (this)-[:CURRENTLY_ACTING_IN]->(this_Movie:Movie)
            RETURN { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } AS currentlyActingIn
            UNION
            WITH this
            MATCH (this)-[:CURRENTLY_ACTING_IN]->(this_Series:Series)
            RETURN { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } AS currentlyActingIn
            }
            RETURN this { currentlyActingIn: head(collect(currentlyActingIn)) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Simple Interface Relationship Query with offset and limit", async () => {
        const query = gql`
            query {
                actors {
                    actedIn(options: { offset: 5, limit: 10, sort: [{ title: DESC }] }) {
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
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH this
            CALL {
            WITH this
            MATCH (this)-[:ACTED_IN]->(this_Movie:Movie)
            RETURN { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } AS actedIn
            UNION
            WITH this
            MATCH (this)-[:ACTED_IN]->(this_Series:Series)
            RETURN { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } AS actedIn
            }
            RETURN this { actedIn: apoc.coll.sortMulti(collect(actedIn), ['title'])[5..15] } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Type filtering using onType", async () => {
        const query = gql`
            query {
                actors {
                    actedIn(where: { _on: { Movie: { title_STARTS_WITH: "The " } } }) {
                        title
                        ... on Movie {
                            runtime
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
            WITH this
            CALL {
            WITH this
            MATCH (this)-[:ACTED_IN]->(this_Movie:Movie)
            WHERE this_Movie.title STARTS WITH $this_actedIn.args.where._on.Movie.title_STARTS_WITH
            RETURN { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } AS actedIn
            }
            RETURN this { actedIn: collect(actedIn) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actedIn\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"_on\\": {
                                \\"Movie\\": {
                                    \\"title_STARTS_WITH\\": \\"The \\"
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Filter overriding using onType", async () => {
        const query = gql`
            query {
                actors {
                    actedIn(where: { title_STARTS_WITH: "A ", _on: { Movie: { title_STARTS_WITH: "The " } } }) {
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
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH this
            CALL {
            WITH this
            MATCH (this)-[:ACTED_IN]->(this_Movie:Movie)
            WHERE this_Movie.title STARTS WITH $this_actedIn.args.where._on.Movie.title_STARTS_WITH
            RETURN { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } AS actedIn
            UNION
            WITH this
            MATCH (this)-[:ACTED_IN]->(this_Series:Series)
            WHERE this_Series.title STARTS WITH $this_actedIn.args.where.title_STARTS_WITH
            RETURN { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } AS actedIn
            }
            RETURN this { actedIn: collect(actedIn) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actedIn\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"_on\\": {
                                \\"Movie\\": {
                                    \\"title_STARTS_WITH\\": \\"The \\"
                                }
                            },
                            \\"title_STARTS_WITH\\": \\"A \\"
                        }
                    }
                }
            }"
        `);
    });

    test("Interface Relationship Query through connection", async () => {
        const query = gql`
            query {
                actors {
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
            WITH collect(edge) as edges
            RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
            }
            RETURN this { actedInConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Interface Relationship Query through connection with where", async () => {
        const query = gql`
            query {
                actors {
                    actedInConnection(where: { node: { title_STARTS_WITH: "The " }, edge: { screenTime_GT: 60 } }) {
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
            WHERE this_acted_in_relationship.screenTime > $this_actedInConnection.args.where.edge.screenTime_GT AND this_Movie.title STARTS WITH $this_actedInConnection.args.where.node.title_STARTS_WITH
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
            WHERE this_acted_in_relationship.screenTime > $this_actedInConnection.args.where.edge.screenTime_GT AND this_Series.title STARTS WITH $this_actedInConnection.args.where.node.title_STARTS_WITH
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges
            RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
            }
            RETURN this { actedInConnection } as this"
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
                            },
                            \\"node\\": {
                                \\"title_STARTS_WITH\\": \\"The \\"
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Interface Relationship Query through connection with where excluding type", async () => {
        const query = gql`
            query {
                actors {
                    actedInConnection(
                        where: { node: { _on: { Movie: { title_STARTS_WITH: "The " } } }, edge: { screenTime_GT: 60 } }
                    ) {
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
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
            WHERE this_acted_in_relationship.screenTime > $this_actedInConnection.args.where.edge.screenTime_GT AND this_Movie.title STARTS WITH $this_actedInConnection.args.where.node._on.Movie.title_STARTS_WITH
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges
            RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
            }
            RETURN this { actedInConnection } as this"
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
                            },
                            \\"node\\": {
                                \\"_on\\": {
                                    \\"Movie\\": {
                                        \\"title_STARTS_WITH\\": \\"The \\"
                                    }
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Interface Relationship Query through connection with where overriding", async () => {
        const query = gql`
            query {
                actors {
                    actedInConnection(
                        where: {
                            node: { title_STARTS_WITH: "The ", _on: { Movie: { title_STARTS_WITH: "A " } } }
                            edge: { screenTime_GT: 60 }
                        }
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
            WHERE this_acted_in_relationship.screenTime > $this_actedInConnection.args.where.edge.screenTime_GT AND this_Movie.title STARTS WITH $this_actedInConnection.args.where.node._on.Movie.title_STARTS_WITH
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_Series:Series)
            WHERE this_acted_in_relationship.screenTime > $this_actedInConnection.args.where.edge.screenTime_GT AND this_Series.title STARTS WITH $this_actedInConnection.args.where.node.title_STARTS_WITH
            WITH { screenTime: this_acted_in_relationship.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges
            RETURN { edges: edges, totalCount: size(edges) } AS actedInConnection
            }
            RETURN this { actedInConnection } as this"
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
                            },
                            \\"node\\": {
                                \\"title_STARTS_WITH\\": \\"The \\",
                                \\"_on\\": {
                                    \\"Movie\\": {
                                        \\"title_STARTS_WITH\\": \\"A \\"
                                    }
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });
});

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

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("interface relationships with aliased fields", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
            }

            type Movie implements Production {
                title: String! @alias(property: "movieTitle")
                runtime: Int!
            }

            type Series implements Production {
                title: String! @alias(property: "seriesTitle")
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                currentlyActingIn: Production @relationship(type: "CURRENTLY_ACTING_IN", direction: OUT)
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ProtectedActor
                @authorization(
                    validate: [{ where: { node: { actedInConnection: { node: { title: "$jwt.title" } } } } }]
                ) {
                name: String! @alias(property: "dbName")
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should read and return interface relationship fields with interface relationship filter SOME", async () => {
        const query = /* GraphQL */ `
            query Actors($title: String) {
                actors(where: { actedInConnection_SOME: { node: { title: $title } } }) {
                    name
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

        const result = await translateQuery(neoSchema, query, {
            variableValues: { title: "movieTitle2" },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE EXISTS {
                MATCH (this)-[this0:ACTED_IN]->(this1)
                WHERE (CASE
                    WHEN this1:Movie THEN this1.movieTitle
                    WHEN this1:Series THEN this1.seriesTitle
                    ELSE this1.title
                END = $param0 AND (this1:Movie OR this1:Series))
            }
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this2:ACTED_IN]->(this3:Movie)
                    WITH this3 { .runtime, title: this3.movieTitle, __resolveType: \\"Movie\\", __id: id(this3) } AS this3
                    RETURN this3 AS var4
                    UNION
                    WITH *
                    MATCH (this)-[this5:ACTED_IN]->(this6:Series)
                    WITH this6 { .episodes, title: this6.seriesTitle, __resolveType: \\"Series\\", __id: id(this6) } AS this6
                    RETURN this6 AS var4
                }
                WITH var4
                RETURN collect(var4) AS var4
            }
            RETURN this { .name, actedIn: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"movieTitle2\\"
            }"
        `);
    });

    test("delete", async () => {
        const query = /* GraphQL */ `
            mutation deleteActors($title: String) {
                deleteActors(where: { actedInConnection_SOME: { node: { title: $title } } }) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: { title: "movieTitle2" },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE EXISTS {
                MATCH (this)-[this0:ACTED_IN]->(this1)
                WHERE (CASE
                    WHEN this1:Movie THEN this1.movieTitle
                    WHEN this1:Series THEN this1.seriesTitle
                    ELSE this1.title
                END = $param0 AND (this1:Movie OR this1:Series))
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"movieTitle2\\"
            }"
        `);
    });

    test("auth", async () => {
        const query = /* GraphQL */ `
            query ProtectedActors {
                protectedActors {
                    name
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:ProtectedActor)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this)-[this1:ACTED_IN]->(this0) WHERE (($jwt.title IS NOT NULL AND CASE
                WHEN this0:Movie THEN this0.movieTitle
                WHEN this0:Series THEN this0.seriesTitle
                ELSE this0.title
            END = $jwt.title) AND (this0:Movie OR this0:Series)) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this2:ACTED_IN]->(this3:Movie)
                    WITH this3 { .runtime, title: this3.movieTitle, __resolveType: \\"Movie\\", __id: id(this3) } AS this3
                    RETURN this3 AS var4
                    UNION
                    WITH *
                    MATCH (this)-[this5:ACTED_IN]->(this6:Series)
                    WITH this6 { .episodes, title: this6.seriesTitle, __resolveType: \\"Series\\", __id: id(this6) } AS this6
                    RETURN this6 AS var4
                }
                WITH var4
                RETURN collect(var4) AS var4
            }
            RETURN this { name: this.dbName, actedIn: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": false,
                \\"jwt\\": {}
            }"
        `);
    });
});

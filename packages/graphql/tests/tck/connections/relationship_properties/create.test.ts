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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Relationship Properties Create Cypher", () => {
    const secret = "secret";
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
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
    });

    test("Create movie with a relationship that has properties", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            title: "Forrest Gump"
                            actors: { create: [{ node: { name: "Tom Hanks" }, edge: { screenTime: 60 } }] }
                        }
                    ]
                ) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                screenTime
                                node {
                                    name
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
            "UNWIND [ { title: $create_param0, actors: { create: [ { node: { name: $create_param1 }, edge: { screenTime: $create_param2 } } ] } } ] AS create_var1
            CALL {
                WITH create_var1
                CREATE (create_this0:\`Movie\`)
                SET
                    create_this0.title = create_var1.title
                WITH create_this0, create_var1
                CALL {
                    WITH create_this0, create_var1
                    UNWIND create_var1.actors.create AS create_var2
                    WITH create_var2.node AS create_var3, create_var2.edge AS create_var4, create_this0
                    CREATE (create_this5:\`Actor\`)
                    SET
                        create_this5.name = create_var3.name
                    MERGE (create_this5)-[create_this6:ACTED_IN]->(create_this0)
                    SET
                        create_this6.screenTime = create_var4.screenTime
                    RETURN collect(NULL)
                }
                RETURN create_this0
            }
            CALL {
                WITH create_this0
                MATCH (create_this0)<-[create_this0_connection_actorsConnectionthis0:ACTED_IN]-(create_this0_Actor:\`Actor\`)
                WITH { screenTime: create_this0_connection_actorsConnectionthis0.screenTime, node: { name: create_this0_Actor.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS create_this0_actorsConnection
            }
            RETURN collect(create_this0 { .title, actorsConnection: create_this0_actorsConnection }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"Forrest Gump\\",
                \\"create_param1\\": \\"Tom Hanks\\",
                \\"create_param2\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

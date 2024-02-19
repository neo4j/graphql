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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("https://github.com/neo4j/graphql/issues/3901", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type User {
                id: ID! @id
                series: [Serie!]! @relationship(type: "PUBLISHER", direction: OUT)
            }

            type Serie
                @authorization(
                    validate: [
                        {
                            operations: [CREATE]
                            when: [AFTER]
                            where: {
                                AND: [
                                    { node: { publisher: { id: "$jwt.sub" } } }
                                    { jwt: { roles_INCLUDES: "verified" } }
                                    { jwt: { roles_INCLUDES: "creator" } }
                                ]
                            }
                        }
                    ]
                ) {
                id: ID! @id
                title: String!

                seasons: [Season!]! @relationship(type: "SEASON_OF", direction: IN)
                publisher: User! @relationship(type: "PUBLISHER", direction: IN)
            }

            type Season
                @authorization(
                    validate: [
                        {
                            operations: [CREATE]
                            when: [AFTER]
                            where: {
                                AND: [
                                    { node: { serie: { publisher: { id: "$jwt.sub" } } } }
                                    { jwt: { roles_INCLUDES: "verified" } }
                                    { jwt: { roles_INCLUDES: "creator" } }
                                ]
                            }
                        }
                    ]
                ) {
                id: ID! @id
                number: Int!
                serie: Serie! @relationship(type: "SEASON_OF", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("should not add an authorization check for connects coming from create", async () => {
        const query = /* GraphQL */ `
            mutation createSerie($title: String!, $userId: ID!) {
                createSeries(
                    input: [
                        {
                            title: $title
                            publisher: { connect: { where: { node: { id: $userId } } } }
                            seasons: { create: { node: { number: 1 } } }
                        }
                    ]
                ) {
                    series {
                        id
                        title
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "michel" });
        const result = await translateQuery(neoSchema, query, {
            variableValues: { title: "Title", userId: "ID" },
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Serie)
            SET this0.id = randomUUID()
            SET this0.title = $this0_title
            WITH *
            CREATE (this0_seasons0_node:Season)
            SET this0_seasons0_node.id = randomUUID()
            SET this0_seasons0_node.number = $this0_seasons0_node_number
            MERGE (this0)<-[:SEASON_OF]-(this0_seasons0_node)
            WITH *
            CALL {
            	WITH this0_seasons0_node
            	MATCH (this0_seasons0_node)-[this0_seasons0_node_serie_Serie_unique:SEASON_OF]->(:Serie)
            	WITH count(this0_seasons0_node_serie_Serie_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDSeason.serie required exactly once', [0])
            	RETURN c AS this0_seasons0_node_serie_Serie_unique_ignored
            }
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_publisher_connect0_node:User)
            	WHERE this0_publisher_connect0_node.id = $this0_publisher_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_publisher_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_publisher_connect0_node
            			MERGE (this0)<-[:PUBLISHER]-(this0_publisher_connect0_node)
            		}
            	}
            WITH this0, this0_publisher_connect0_node
            	RETURN count(*) AS connect_this0_publisher_connect_User0
            }
            WITH *
            CALL {
            	WITH this0
            	MATCH (this0)<-[this0_publisher_User_unique:PUBLISHER]-(:User)
            	WITH count(this0_publisher_User_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDSerie.publisher required exactly once', [0])
            	RETURN c AS this0_publisher_User_unique_ignored
            }
            WITH *
            CALL {
                WITH this0_seasons0_node
                MATCH (this0_seasons0_node)-[:SEASON_OF]->(authorization_0_1_0_0_after_this1:Serie)
                OPTIONAL MATCH (authorization_0_1_0_0_after_this1)<-[:PUBLISHER]-(authorization_0_1_0_0_after_this2:User)
                WITH *, count(authorization_0_1_0_0_after_this2) AS publisherCount
                WITH *
                WHERE (publisherCount <> 0 AND ($jwt.sub IS NOT NULL AND authorization_0_1_0_0_after_this2.id = $jwt.sub))
                RETURN count(authorization_0_1_0_0_after_this1) = 1 AS authorization_0_1_0_0_after_var0
            }
            OPTIONAL MATCH (this0)<-[:PUBLISHER]-(authorization_0_after_this0:User)
            WITH *, count(authorization_0_after_this0) AS publisherCount
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (authorization_0_1_0_0_after_var0 = true AND ($jwt.roles IS NOT NULL AND $authorization_0_1_0_0_after_param2 IN $jwt.roles) AND ($jwt.roles IS NOT NULL AND $authorization_0_1_0_0_after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ((publisherCount <> 0 AND ($jwt.sub IS NOT NULL AND authorization_0_after_this0.id = $jwt.sub)) AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param2 IN $jwt.roles) AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0
            }
            CALL {
                WITH this0
                RETURN this0 { .id, .title } AS create_var0
            }
            RETURN [create_var0] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Title\\",
                \\"this0_seasons0_node_number\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"michel\\"
                },
                \\"authorization_0_1_0_0_after_param2\\": \\"verified\\",
                \\"authorization_0_1_0_0_after_param3\\": \\"creator\\",
                \\"this0_publisher_connect0_node_param0\\": \\"ID\\",
                \\"authorization_0_after_param2\\": \\"verified\\",
                \\"authorization_0_after_param3\\": \\"creator\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

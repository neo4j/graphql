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
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Create or connect with unions", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                isan: String! @unique
            }

            type Series {
                title: String!
                isan: String! @unique
            }

            union Production = Movie | Series

            interface ActedIn @relationshipProperties {
                screentime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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

    test("Create with createOrConnect operation", async () => {
        const query = gql`
            mutation {
                createActors(
                    input: [
                        {
                            name: "Tom Hanks"
                            actedIn: {
                                Movie: {
                                    connectOrCreate: {
                                        where: { node: { isan: "0000-0000-03B6-0000-O-0000-0006-P" } }
                                        onCreate: {
                                            edge: { screentime: 105 }
                                            node: { title: "Forrest Gump", isan: "0000-0000-03B6-0000-O-0000-0006-P" }
                                        }
                                    }
                                }
                                Series: {
                                    connectOrCreate: {
                                        where: { node: { isan: "0000-0001-ECC5-0000-8-0000-0001-B" } }
                                        onCreate: {
                                            edge: { screentime: 126 }
                                            node: {
                                                title: "Band of Brothers"
                                                isan: "0000-0001-ECC5-0000-8-0000-0001-B"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                ) {
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
            "CALL {
            CREATE (this0:Actor)
            SET this0.name = $this0_name
            	WITH this0
            CALL {
            	WITH this0
            	MERGE (this0_actedIn_Movie_connectOrCreate_this1:\`Movie\` { isan: $this0_actedIn_Movie_connectOrCreate_param1 })
            ON CREATE SET
                    this0_actedIn_Movie_connectOrCreate_this1.title = $this0_actedIn_Movie_connectOrCreate_param2,
            this0_actedIn_Movie_connectOrCreate_this1.isan = $this0_actedIn_Movie_connectOrCreate_param3
            MERGE (this0)-[this0_actedIn_Movie_connectOrCreate_this0:\`ACTED_IN\`]->(this0_actedIn_Movie_connectOrCreate_this1)
            ON CREATE SET
                    this0_actedIn_Movie_connectOrCreate_this0.screentime = $this0_actedIn_Movie_connectOrCreate_param0
            	RETURN COUNT(*)
            }
            	WITH this0
            CALL {
            	WITH this0
            	MERGE (this0_actedIn_Series_connectOrCreate_this1:\`Series\` { isan: $this0_actedIn_Series_connectOrCreate_param1 })
            ON CREATE SET
                    this0_actedIn_Series_connectOrCreate_this1.title = $this0_actedIn_Series_connectOrCreate_param2,
            this0_actedIn_Series_connectOrCreate_this1.isan = $this0_actedIn_Series_connectOrCreate_param3
            MERGE (this0)-[this0_actedIn_Series_connectOrCreate_this0:\`ACTED_IN\`]->(this0_actedIn_Series_connectOrCreate_this1)
            ON CREATE SET
                    this0_actedIn_Series_connectOrCreate_this0.screentime = $this0_actedIn_Series_connectOrCreate_param0
            	RETURN COUNT(*)
            }
            RETURN this0
            }
            RETURN [
            this0 { .name }] AS data"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"Tom Hanks\\",
                \\"this0_actedIn_Movie_connectOrCreate_param0\\": {
                    \\"low\\": 105,
                    \\"high\\": 0
                },
                \\"this0_actedIn_Movie_connectOrCreate_param1\\": \\"0000-0000-03B6-0000-O-0000-0006-P\\",
                \\"this0_actedIn_Movie_connectOrCreate_param2\\": \\"Forrest Gump\\",
                \\"this0_actedIn_Movie_connectOrCreate_param3\\": \\"0000-0000-03B6-0000-O-0000-0006-P\\",
                \\"this0_actedIn_Series_connectOrCreate_param0\\": {
                    \\"low\\": 126,
                    \\"high\\": 0
                },
                \\"this0_actedIn_Series_connectOrCreate_param1\\": \\"0000-0001-ECC5-0000-8-0000-0001-B\\",
                \\"this0_actedIn_Series_connectOrCreate_param2\\": \\"Band of Brothers\\",
                \\"this0_actedIn_Series_connectOrCreate_param3\\": \\"0000-0001-ECC5-0000-8-0000-0001-B\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update with createOrConnect operation", async () => {
        const query = gql`
            mutation {
                updateActors(
                    update: {
                        name: "Tom Hanks"
                        actedIn: {
                            Movie: {
                                connectOrCreate: {
                                    where: { node: { isan: "0000-0000-03B6-0000-O-0000-0006-P" } }
                                    onCreate: {
                                        edge: { screentime: 105 }
                                        node: { title: "Forrest Gump", isan: "0000-0000-03B6-0000-O-0000-0006-P" }
                                    }
                                }
                            }
                            Series: {
                                connectOrCreate: {
                                    where: { node: { isan: "0000-0001-ECC5-0000-8-0000-0001-B" } }
                                    onCreate: {
                                        edge: { screentime: 126 }
                                        node: { title: "Band of Brothers", isan: "0000-0001-ECC5-0000-8-0000-0001-B" }
                                    }
                                }
                            }
                        }
                    }
                    where: { name: "Tom Hanks evil twin" }
                ) {
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
            "MATCH (this:Actor)
            WHERE this.name = $this_name
            SET this.name = $this_update_name
            	WITH this
            CALL {
            	WITH this
            	MERGE (this_actedIn_Movie0_connectOrCreate_this1:\`Movie\` { isan: $this_actedIn_Movie0_connectOrCreate_param1 })
            ON CREATE SET
                    this_actedIn_Movie0_connectOrCreate_this1.title = $this_actedIn_Movie0_connectOrCreate_param2,
            this_actedIn_Movie0_connectOrCreate_this1.isan = $this_actedIn_Movie0_connectOrCreate_param3
            MERGE (this)-[this_actedIn_Movie0_connectOrCreate_this0:\`ACTED_IN\`]->(this_actedIn_Movie0_connectOrCreate_this1)
            ON CREATE SET
                    this_actedIn_Movie0_connectOrCreate_this0.screentime = $this_actedIn_Movie0_connectOrCreate_param0
            	RETURN COUNT(*)
            }
            	WITH this
            CALL {
            	WITH this
            	MERGE (this_actedIn_Series0_connectOrCreate_this1:\`Series\` { isan: $this_actedIn_Series0_connectOrCreate_param1 })
            ON CREATE SET
                    this_actedIn_Series0_connectOrCreate_this1.title = $this_actedIn_Series0_connectOrCreate_param2,
            this_actedIn_Series0_connectOrCreate_this1.isan = $this_actedIn_Series0_connectOrCreate_param3
            MERGE (this)-[this_actedIn_Series0_connectOrCreate_this0:\`ACTED_IN\`]->(this_actedIn_Series0_connectOrCreate_this1)
            ON CREATE SET
                    this_actedIn_Series0_connectOrCreate_this0.screentime = $this_actedIn_Series0_connectOrCreate_param0
            	RETURN COUNT(*)
            }
            RETURN collect(DISTINCT this { .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_name\\": \\"Tom Hanks evil twin\\",
                \\"this_update_name\\": \\"Tom Hanks\\",
                \\"this_actedIn_Movie0_connectOrCreate_param0\\": {
                    \\"low\\": 105,
                    \\"high\\": 0
                },
                \\"this_actedIn_Movie0_connectOrCreate_param1\\": \\"0000-0000-03B6-0000-O-0000-0006-P\\",
                \\"this_actedIn_Movie0_connectOrCreate_param2\\": \\"Forrest Gump\\",
                \\"this_actedIn_Movie0_connectOrCreate_param3\\": \\"0000-0000-03B6-0000-O-0000-0006-P\\",
                \\"this_actedIn_Series0_connectOrCreate_param0\\": {
                    \\"low\\": 126,
                    \\"high\\": 0
                },
                \\"this_actedIn_Series0_connectOrCreate_param1\\": \\"0000-0001-ECC5-0000-8-0000-0001-B\\",
                \\"this_actedIn_Series0_connectOrCreate_param2\\": \\"Band of Brothers\\",
                \\"this_actedIn_Series0_connectOrCreate_param3\\": \\"0000-0001-ECC5-0000-8-0000-0001-B\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

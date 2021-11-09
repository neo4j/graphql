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
            config: { enableRegex: true, jwt: { secret } },
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
            MERGE (this0_actedIn_Movie_connectOrCreate0:Movie { isan: $this0_actedIn_Movie_connectOrCreate0_where_isan })
            ON CREATE SET
            this0_actedIn_Movie_connectOrCreate0.title = $this0_actedIn_Movie_connectOrCreate0_title,
            this0_actedIn_Movie_connectOrCreate0.isan = $this0_actedIn_Movie_connectOrCreate0_isan
            MERGE (this0)-[this0_relationship_this0_actedIn_Movie_connectOrCreate0:ACTED_IN]->(this0_actedIn_Movie_connectOrCreate0)
            ON CREATE SET
            this0_relationship_this0_actedIn_Movie_connectOrCreate0.screentime = $this0_relationship_this0_actedIn_Movie_connectOrCreate0_screentime
            MERGE (this0_actedIn_Series_connectOrCreate0:Series { isan: $this0_actedIn_Series_connectOrCreate0_where_isan })
            ON CREATE SET
            this0_actedIn_Series_connectOrCreate0.title = $this0_actedIn_Series_connectOrCreate0_title,
            this0_actedIn_Series_connectOrCreate0.isan = $this0_actedIn_Series_connectOrCreate0_isan
            MERGE (this0)-[this0_relationship_this0_actedIn_Series_connectOrCreate0:ACTED_IN]->(this0_actedIn_Series_connectOrCreate0)
            ON CREATE SET
            this0_relationship_this0_actedIn_Series_connectOrCreate0.screentime = $this0_relationship_this0_actedIn_Series_connectOrCreate0_screentime
            RETURN this0
            }
            RETURN
            this0 { .name } AS this0"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"Tom Hanks\\",
                \\"this0_actedIn_Movie_connectOrCreate0_where_isan\\": \\"0000-0000-03B6-0000-O-0000-0006-P\\",
                \\"this0_actedIn_Movie_connectOrCreate0_title\\": \\"Forrest Gump\\",
                \\"this0_actedIn_Movie_connectOrCreate0_isan\\": \\"0000-0000-03B6-0000-O-0000-0006-P\\",
                \\"this0_relationship_this0_actedIn_Movie_connectOrCreate0_screentime\\": {
                    \\"low\\": 105,
                    \\"high\\": 0
                },
                \\"this0_actedIn_Series_connectOrCreate0_where_isan\\": \\"0000-0001-ECC5-0000-8-0000-0001-B\\",
                \\"this0_actedIn_Series_connectOrCreate0_title\\": \\"Band of Brothers\\",
                \\"this0_actedIn_Series_connectOrCreate0_isan\\": \\"0000-0001-ECC5-0000-8-0000-0001-B\\",
                \\"this0_relationship_this0_actedIn_Series_connectOrCreate0_screentime\\": {
                    \\"low\\": 126,
                    \\"high\\": 0
                }
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
            MERGE (this_actedIn_Movie0_connectOrCreate0:Movie { isan: $this_actedIn_Movie0_connectOrCreate0_where_isan })
            ON CREATE SET
            this_actedIn_Movie0_connectOrCreate0.title = $this_actedIn_Movie0_connectOrCreate0_title,
            this_actedIn_Movie0_connectOrCreate0.isan = $this_actedIn_Movie0_connectOrCreate0_isan
            MERGE (this)-[this_relationship_this_actedIn_Movie0_connectOrCreate0:ACTED_IN]->(this_actedIn_Movie0_connectOrCreate0)
            ON CREATE SET
            this_relationship_this_actedIn_Movie0_connectOrCreate0.screentime = $this_relationship_this_actedIn_Movie0_connectOrCreate0_screentime
            RETURN COUNT(*)
            }
            WITH this
            CALL {
            WITH this
            MERGE (this_actedIn_Series0_connectOrCreate0:Series { isan: $this_actedIn_Series0_connectOrCreate0_where_isan })
            ON CREATE SET
            this_actedIn_Series0_connectOrCreate0.title = $this_actedIn_Series0_connectOrCreate0_title,
            this_actedIn_Series0_connectOrCreate0.isan = $this_actedIn_Series0_connectOrCreate0_isan
            MERGE (this)-[this_relationship_this_actedIn_Series0_connectOrCreate0:ACTED_IN]->(this_actedIn_Series0_connectOrCreate0)
            ON CREATE SET
            this_relationship_this_actedIn_Series0_connectOrCreate0.screentime = $this_relationship_this_actedIn_Series0_connectOrCreate0_screentime
            RETURN COUNT(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_name\\": \\"Tom Hanks evil twin\\",
                \\"this_update_name\\": \\"Tom Hanks\\",
                \\"this_actedIn_Movie0_connectOrCreate0_where_isan\\": \\"0000-0000-03B6-0000-O-0000-0006-P\\",
                \\"this_actedIn_Movie0_connectOrCreate0_title\\": \\"Forrest Gump\\",
                \\"this_actedIn_Movie0_connectOrCreate0_isan\\": \\"0000-0000-03B6-0000-O-0000-0006-P\\",
                \\"this_relationship_this_actedIn_Movie0_connectOrCreate0_screentime\\": {
                    \\"low\\": 105,
                    \\"high\\": 0
                },
                \\"this_actedIn_Series0_connectOrCreate0_where_isan\\": \\"0000-0001-ECC5-0000-8-0000-0001-B\\",
                \\"this_actedIn_Series0_connectOrCreate0_title\\": \\"Band of Brothers\\",
                \\"this_actedIn_Series0_connectOrCreate0_isan\\": \\"0000-0001-ECC5-0000-8-0000-0001-B\\",
                \\"this_relationship_this_actedIn_Series0_connectOrCreate0_screentime\\": {
                    \\"low\\": 126,
                    \\"high\\": 0
                }
            }"
        `);
    });
});

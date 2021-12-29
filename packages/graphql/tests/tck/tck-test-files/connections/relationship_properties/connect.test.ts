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

describe("Relationship Properties Connect Cypher", () => {
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
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Create movie while connecting a relationship that has properties", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ title: "Forrest Gump", actors: { connect: [{ edge: { screenTime: 60 } }] } }]) {
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
            "CALL {
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            WITH this0, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CALL {
            WITH this0, this0_mutateMeta
            	OPTIONAL MATCH (this0_actors_connect0_node:Actor)
            CALL apoc.do.when(this0_actors_connect0_node IS NOT NULL AND this0 IS NOT NULL, \\"
            			MERGE (this0)<-[this0_actors_connect0_relationship:ACTED_IN]-(this0_actors_connect0_node)
            SET this0_actors_connect0_relationship.screenTime = $this0_actors_connect0_relationship_screenTime
            RETURN this0, this0_actors_connect0_node, [ metaVal IN [{type: 'Connected', name: 'Movie', relationshipName: 'ACTED_IN', toName: 'Actor', id: id(this0), relationshipID: id(this0_actors_connect0_relationship), toID: id(this0_actors_connect0_node), properties: this0_actors_connect0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_actors_connect0_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_actors_connect0_node:this0_actors_connect0_node, this0_actors_connect0_relationship_screenTime:$this0_actors_connect0_relationship_screenTime})
            YIELD value
            WITH this0, this0_actors_connect0_node, value.this0_actors_connect0_node_mutateMeta as this0_actors_connect_mutateMeta
            RETURN REDUCE(tmp1_this0_actors_connect_mutateMeta = [], tmp2_this0_actors_connect_mutateMeta IN COLLECT(this0_actors_connect_mutateMeta) | tmp1_this0_actors_connect_mutateMeta + tmp2_this0_actors_connect_mutateMeta) as this0_actors_connect_mutateMeta
            }
            RETURN this0
            }
            WITH this0, this0_mutateMeta as mutateMeta
            CALL {
            WITH this0
            MATCH (this0)<-[this0_acted_in_relationship:ACTED_IN]-(this0_actor:Actor)
            WITH collect({ screenTime: this0_acted_in_relationship.screenTime, node: { name: this0_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN mutateMeta, this0 { .title, actorsConnection } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Forrest Gump\\",
                \\"this0_actors_connect0_relationship_screenTime\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Create movie while connecting a relationship that has properties(with where on node)", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            title: "Forrest Gump"
                            actors: { connect: [{ where: { node: { name: "Tom Hanks" } }, edge: { screenTime: 60 } }] }
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
            "CALL {
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            WITH this0, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CALL {
            WITH this0, this0_mutateMeta
            	OPTIONAL MATCH (this0_actors_connect0_node:Actor)
            	WHERE this0_actors_connect0_node.name = $this0_actors_connect0_node_name
            CALL apoc.do.when(this0_actors_connect0_node IS NOT NULL AND this0 IS NOT NULL, \\"
            			MERGE (this0)<-[this0_actors_connect0_relationship:ACTED_IN]-(this0_actors_connect0_node)
            SET this0_actors_connect0_relationship.screenTime = $this0_actors_connect0_relationship_screenTime
            RETURN this0, this0_actors_connect0_node, [ metaVal IN [{type: 'Connected', name: 'Movie', relationshipName: 'ACTED_IN', toName: 'Actor', id: id(this0), relationshipID: id(this0_actors_connect0_relationship), toID: id(this0_actors_connect0_node), properties: this0_actors_connect0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_actors_connect0_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_actors_connect0_node:this0_actors_connect0_node, this0_actors_connect0_relationship_screenTime:$this0_actors_connect0_relationship_screenTime})
            YIELD value
            WITH this0, this0_actors_connect0_node, value.this0_actors_connect0_node_mutateMeta as this0_actors_connect_mutateMeta
            RETURN REDUCE(tmp1_this0_actors_connect_mutateMeta = [], tmp2_this0_actors_connect_mutateMeta IN COLLECT(this0_actors_connect_mutateMeta) | tmp1_this0_actors_connect_mutateMeta + tmp2_this0_actors_connect_mutateMeta) as this0_actors_connect_mutateMeta
            }
            RETURN this0
            }
            WITH this0, this0_mutateMeta as mutateMeta
            CALL {
            WITH this0
            MATCH (this0)<-[this0_acted_in_relationship:ACTED_IN]-(this0_actor:Actor)
            WITH collect({ screenTime: this0_acted_in_relationship.screenTime, node: { name: this0_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN mutateMeta, this0 { .title, actorsConnection } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Forrest Gump\\",
                \\"this0_actors_connect0_node_name\\": \\"Tom Hanks\\",
                \\"this0_actors_connect0_relationship_screenTime\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Update a movie while connecting a relationship that has properties(top level-connect)", async () => {
        const query = gql`
            mutation {
                updateMovies(where: { title: "Forrest Gump" }, connect: { actors: { edge: { screenTime: 60 } } }) {
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            WITH this
            CALL {
            WITH this
            	OPTIONAL MATCH (this_connect_actors0_node:Actor)
            CALL apoc.do.when(this_connect_actors0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)<-[this_connect_actors0_relationship:ACTED_IN]-(this_connect_actors0_node)
            SET this_connect_actors0_relationship.screenTime = $this_connect_actors0_relationship_screenTime
            RETURN this, this_connect_actors0_node, [ metaVal IN [{type: 'Connected', name: 'Movie', relationshipName: 'ACTED_IN', toName: 'Actor', id: id(this), relationshipID: id(this_connect_actors0_relationship), toID: id(this_connect_actors0_node), properties: this_connect_actors0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_connect_actors0_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_actors0_node:this_connect_actors0_node, this_connect_actors0_relationship_screenTime:$this_connect_actors0_relationship_screenTime})
            YIELD value
            WITH this, this_connect_actors0_node, value.this_connect_actors0_node_mutateMeta as this_connect_actors_mutateMeta
            RETURN REDUCE(tmp1_this_connect_actors_mutateMeta = [], tmp2_this_connect_actors_mutateMeta IN COLLECT(this_connect_actors_mutateMeta) | tmp1_this_connect_actors_mutateMeta + tmp2_this_connect_actors_mutateMeta) as this_connect_actors_mutateMeta
            }
            WITH this
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN mutateMeta, this { .title, actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\",
                \\"this_connect_actors0_relationship_screenTime\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Update a movie while connecting a relationship that has properties(top level-connect)(with where on node)", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { title: "Forrest Gump" }
                    connect: { actors: { where: { node: { name: "Tom Hanks" } }, edge: { screenTime: 60 } } }
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            WITH this
            CALL {
            WITH this
            	OPTIONAL MATCH (this_connect_actors0_node:Actor)
            	WHERE this_connect_actors0_node.name = $this_connect_actors0_node_name
            CALL apoc.do.when(this_connect_actors0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)<-[this_connect_actors0_relationship:ACTED_IN]-(this_connect_actors0_node)
            SET this_connect_actors0_relationship.screenTime = $this_connect_actors0_relationship_screenTime
            RETURN this, this_connect_actors0_node, [ metaVal IN [{type: 'Connected', name: 'Movie', relationshipName: 'ACTED_IN', toName: 'Actor', id: id(this), relationshipID: id(this_connect_actors0_relationship), toID: id(this_connect_actors0_node), properties: this_connect_actors0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_connect_actors0_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_actors0_node:this_connect_actors0_node, this_connect_actors0_relationship_screenTime:$this_connect_actors0_relationship_screenTime})
            YIELD value
            WITH this, this_connect_actors0_node, value.this_connect_actors0_node_mutateMeta as this_connect_actors_mutateMeta
            RETURN REDUCE(tmp1_this_connect_actors_mutateMeta = [], tmp2_this_connect_actors_mutateMeta IN COLLECT(this_connect_actors_mutateMeta) | tmp1_this_connect_actors_mutateMeta + tmp2_this_connect_actors_mutateMeta) as this_connect_actors_mutateMeta
            }
            WITH this
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN mutateMeta, this { .title, actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\",
                \\"this_connect_actors0_node_name\\": \\"Tom Hanks\\",
                \\"this_connect_actors0_relationship_screenTime\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });
});

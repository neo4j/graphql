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
import { createJwtRequest } from "../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher -> Connections -> Projections -> Create", () => {
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

    test("Connection can be selected following the creation of a single node", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ title: "Forrest Gump" }]) {
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
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT([ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ]) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
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
                \\"this0_title\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Connection can be selected following the creation of a multiple nodes", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ title: "Forrest Gump" }, { title: "Toy Story" }]) {
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
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT([ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ]) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            CALL {
            CREATE (this1:Movie)
            SET this1.title = $this1_title
            RETURN this1, REDUCE(tmp1_this1_mutateMeta = [], tmp2_this1_mutateMeta IN COLLECT([ metaVal IN [{type: 'Created', name: 'Movie', id: id(this1), properties: this1}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ]) | tmp1_this1_mutateMeta + tmp2_this1_mutateMeta) as this1_mutateMeta
            }
            WITH this0, this1, mutateMeta + this1_mutateMeta as mutateMeta
            CALL {
            WITH this0
            MATCH (this0)<-[this0_acted_in_relationship:ACTED_IN]-(this0_actor:Actor)
            WITH collect({ screenTime: this0_acted_in_relationship.screenTime, node: { name: this0_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            CALL {
            WITH this1
            MATCH (this1)<-[this1_acted_in_relationship:ACTED_IN]-(this1_actor:Actor)
            WITH collect({ screenTime: this1_acted_in_relationship.screenTime, node: { name: this1_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN mutateMeta, this0 { .title, actorsConnection } AS this0, this1 { .title, actorsConnection } AS this1"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Forrest Gump\\",
                \\"this1_title\\": \\"Toy Story\\"
            }"
        `);
    });

    test("Connection can be selected and filtered following the creation of a multiple nodes", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ title: "Forrest Gump" }, { title: "Toy Story" }]) {
                    movies {
                        title
                        actorsConnection(where: { node: { name: "Tom Hanks" } }) {
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
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT([ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ]) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            CALL {
            CREATE (this1:Movie)
            SET this1.title = $this1_title
            RETURN this1, REDUCE(tmp1_this1_mutateMeta = [], tmp2_this1_mutateMeta IN COLLECT([ metaVal IN [{type: 'Created', name: 'Movie', id: id(this1), properties: this1}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ]) | tmp1_this1_mutateMeta + tmp2_this1_mutateMeta) as this1_mutateMeta
            }
            WITH this0, this1, mutateMeta + this1_mutateMeta as mutateMeta
            CALL {
            WITH this0
            MATCH (this0)<-[this0_acted_in_relationship:ACTED_IN]-(this0_actor:Actor)
            WHERE this0_actor.name = $this0_actorsConnection.args.where.node.name
            WITH collect({ screenTime: this0_acted_in_relationship.screenTime, node: { name: this0_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            CALL {
            WITH this1
            MATCH (this1)<-[this1_acted_in_relationship:ACTED_IN]-(this1_actor:Actor)
            WHERE this1_actor.name = $this1_actorsConnection.args.where.node.name
            WITH collect({ screenTime: this1_acted_in_relationship.screenTime, node: { name: this1_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN mutateMeta, this0 { .title, actorsConnection } AS this0, this1 { .title, actorsConnection } AS this1"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Forrest Gump\\",
                \\"this1_title\\": \\"Toy Story\\",
                \\"this0_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"name\\": \\"Tom Hanks\\"
                            }
                        }
                    }
                },
                \\"this1_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"name\\": \\"Tom Hanks\\"
                            }
                        }
                    }
                }
            }"
        `);
    });
});

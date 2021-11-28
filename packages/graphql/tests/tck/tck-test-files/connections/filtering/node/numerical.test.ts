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
import { Neo4jGraphQL } from "../../../../../../src";
import { createJwtRequest } from "../../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../../utils/tck-test-utils";

describe("Cypher -> Connections -> Filtering -> Node -> Numerical", () => {
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
                age: Int!
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

    test("LT", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(where: { node: { age_LT: 60 } }) {
                        edges {
                            screenTime
                            node {
                                name
                                age
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
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WHERE this_actor.age < $this_actorsConnection.args.where.node.age_LT
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, age: this_actor.age } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"age_LT\\": {
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

    test("LTE", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(where: { node: { age_LTE: 60 } }) {
                        edges {
                            screenTime
                            node {
                                name
                                age
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
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WHERE this_actor.age <= $this_actorsConnection.args.where.node.age_LTE
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, age: this_actor.age } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"age_LTE\\": {
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

    test("GT", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(where: { node: { age_GT: 60 } }) {
                        edges {
                            screenTime
                            node {
                                name
                                age
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
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WHERE this_actor.age > $this_actorsConnection.args.where.node.age_GT
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, age: this_actor.age } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"age_GT\\": {
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

    test("GTE", async () => {
        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(where: { node: { age_GTE: 60 } }) {
                        edges {
                            screenTime
                            node {
                                name
                                age
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
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WHERE this_actor.age >= $this_actorsConnection.args.where.node.age_GTE
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { name: this_actor.name, age: this_actor.age } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"age_GTE\\": {
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
});

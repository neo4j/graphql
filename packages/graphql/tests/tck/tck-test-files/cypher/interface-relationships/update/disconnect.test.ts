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

describe("Interface Relationships - Update disconnect", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
                actors: [Actor!]!
            }

            type Series implements Production {
                title: String!
                episodes: Int!
                actors: [Actor!]!
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

    test("Update disconnect from an interface relationship", async () => {
        const query = gql`
            mutation {
                updateActors(disconnect: { actedIn: { where: { node: { title_STARTS_WITH: "The " } } } }) {
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
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Movie)
            WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
            FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_rel
            )
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Series)
            WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
            FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_rel
            )
            RETURN count(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"actedIn\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title_STARTS_WITH\\": \\"The \\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }"
        `);
    });

    test("Update disconnect from an interface relationship with nested disconnect", async () => {
        const query = gql`
            mutation {
                updateActors(
                    disconnect: {
                        actedIn: {
                            where: { node: { title_STARTS_WITH: "The " } }
                            disconnect: { actors: { where: { node: { name: "Actor" } } } }
                        }
                    }
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
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Movie)
            WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
            FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_rel
            )
            WITH this, this_disconnect_actedIn0
            CALL {
            WITH this, this_disconnect_actedIn0
            OPTIONAL MATCH (this_disconnect_actedIn0)<-[this_disconnect_actedIn0_actors0_rel:ACTED_IN]-(this_disconnect_actedIn0_actors0:Actor)
            WHERE this_disconnect_actedIn0_actors0.name = $updateActors.args.disconnect.actedIn[0].disconnect.actors[0].where.node.name
            FOREACH(_ IN CASE this_disconnect_actedIn0_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_actors0_rel
            )
            RETURN count(*)
            }
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Series)
            WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
            FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_rel
            )
            WITH this, this_disconnect_actedIn0
            CALL {
            WITH this, this_disconnect_actedIn0
            OPTIONAL MATCH (this_disconnect_actedIn0)<-[this_disconnect_actedIn0_actors0_rel:ACTED_IN]-(this_disconnect_actedIn0_actors0:Actor)
            WHERE this_disconnect_actedIn0_actors0.name = $updateActors.args.disconnect.actedIn[0].disconnect.actors[0].where.node.name
            FOREACH(_ IN CASE this_disconnect_actedIn0_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_actors0_rel
            )
            RETURN count(*)
            }
            RETURN count(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"actedIn\\": [
                                {
                                    \\"disconnect\\": {
                                        \\"actors\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"name\\": \\"Actor\\"
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title_STARTS_WITH\\": \\"The \\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }"
        `);
    });

    test("Update disconnect from an interface relationship with nested disconnect using _on to disconnect from only one implementation", async () => {
        const query = gql`
            mutation {
                updateActors(
                    disconnect: {
                        actedIn: {
                            where: { node: { title_STARTS_WITH: "The " } }
                            disconnect: { _on: { Movie: { actors: { where: { node: { name: "Actor" } } } } } }
                        }
                    }
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
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Movie)
            WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
            FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_rel
            )
            WITH this, this_disconnect_actedIn0
            CALL {
            WITH this, this_disconnect_actedIn0
            OPTIONAL MATCH (this_disconnect_actedIn0)<-[this_disconnect_actedIn0_actors0_rel:ACTED_IN]-(this_disconnect_actedIn0_actors0:Actor)
            WHERE this_disconnect_actedIn0_actors0.name = $updateActors.args.disconnect.actedIn[0].disconnect._on.Movie[0].actors[0].where.node.name
            FOREACH(_ IN CASE this_disconnect_actedIn0_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_actors0_rel
            )
            RETURN count(*)
            }
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Series)
            WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
            FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_rel
            )
            RETURN count(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"actedIn\\": [
                                {
                                    \\"disconnect\\": {
                                        \\"_on\\": {
                                            \\"Movie\\": [
                                                {
                                                    \\"actors\\": [
                                                        {
                                                            \\"where\\": {
                                                                \\"node\\": {
                                                                    \\"name\\": \\"Actor\\"
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    },
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title_STARTS_WITH\\": \\"The \\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }"
        `);
    });

    test("Update disconnect from an interface relationship with nested disconnect using _on to override disconnection", async () => {
        const query = gql`
            mutation {
                updateActors(
                    disconnect: {
                        actedIn: {
                            where: { node: { title_STARTS_WITH: "The " } }
                            disconnect: {
                                actors: { where: { node: { name: "Actor" } } }
                                _on: { Movie: { actors: { where: { node: { name: "Different Actor" } } } } }
                            }
                        }
                    }
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
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Movie)
            WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
            FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_rel
            )
            WITH this, this_disconnect_actedIn0
            CALL {
            WITH this, this_disconnect_actedIn0
            OPTIONAL MATCH (this_disconnect_actedIn0)<-[this_disconnect_actedIn0_actors0_rel:ACTED_IN]-(this_disconnect_actedIn0_actors0:Actor)
            WHERE this_disconnect_actedIn0_actors0.name = $updateActors.args.disconnect.actedIn[0].disconnect._on.Movie[0].actors[0].where.node.name
            FOREACH(_ IN CASE this_disconnect_actedIn0_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_actors0_rel
            )
            RETURN count(*)
            }
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Series)
            WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors.args.disconnect.actedIn[0].where.node.title_STARTS_WITH
            FOREACH(_ IN CASE this_disconnect_actedIn0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_rel
            )
            WITH this, this_disconnect_actedIn0
            CALL {
            WITH this, this_disconnect_actedIn0
            OPTIONAL MATCH (this_disconnect_actedIn0)<-[this_disconnect_actedIn0_actors0_rel:ACTED_IN]-(this_disconnect_actedIn0_actors0:Actor)
            WHERE this_disconnect_actedIn0_actors0.name = $updateActors.args.disconnect.actedIn[0].disconnect.actors[0].where.node.name
            FOREACH(_ IN CASE this_disconnect_actedIn0_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actedIn0_actors0_rel
            )
            RETURN count(*)
            }
            RETURN count(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"actedIn\\": [
                                {
                                    \\"disconnect\\": {
                                        \\"actors\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"name\\": \\"Actor\\"
                                                    }
                                                }
                                            }
                                        ],
                                        \\"_on\\": {
                                            \\"Movie\\": [
                                                {
                                                    \\"actors\\": [
                                                        {
                                                            \\"where\\": {
                                                                \\"node\\": {
                                                                    \\"name\\": \\"Different Actor\\"
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    },
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title_STARTS_WITH\\": \\"The \\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }"
        `);
    });
});

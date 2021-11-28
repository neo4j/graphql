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

describe("Interface Relationships - Update update", () => {
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

    test("Update update an interface relationship", async () => {
        const query = gql`
            mutation {
                updateActors(
                    update: {
                        actedIn: { where: { node: { title: "Old Title" } }, update: { node: { title: "New Title" } } }
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
            OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
            WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
            CALL apoc.do.when(this_actedIn0 IS NOT NULL, \\"
            SET this_actedIn0.title = $this_update_actedIn0_title
            WITH this, this_actedIn0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this_actedIn0)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN count(*)
            \\", \\"\\", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_title:$this_update_actedIn0_title})
            YIELD value as _
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Series)
            WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
            CALL apoc.do.when(this_actedIn0 IS NOT NULL, \\"
            SET this_actedIn0.title = $this_update_actedIn0_title
            WITH this, this_actedIn0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this_actedIn0)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDSeries.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN count(*)
            \\", \\"\\", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_title:$this_update_actedIn0_title})
            YIELD value as _
            RETURN count(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_actedIn0_title\\": \\"New Title\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                },
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actedIn\\": [
                                {
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"title\\": \\"New Title\\"
                                        }
                                    },
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title\\": \\"Old Title\\"
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

    test("Update update an interface relationship with nested update", async () => {
        const query = gql`
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            where: { node: { title: "Old Title" } }
                            update: { node: { actors: { update: { node: { name: "New Actor Name" } } } } }
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
            OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
            WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
            CALL apoc.do.when(this_actedIn0 IS NOT NULL, \\"
            WITH this, this_actedIn0
            OPTIONAL MATCH (this_actedIn0)<-[this_actedIn0_acted_in0_relationship:ACTED_IN]-(this_actedIn0_actors0:Actor)
            CALL apoc.do.when(this_actedIn0_actors0 IS NOT NULL, \\\\\\"
            SET this_actedIn0_actors0.name = $this_update_actedIn0_actors0_name
            RETURN count(*)
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_actedIn0:this_actedIn0, updateActors: $updateActors, this_actedIn0_actors0:this_actedIn0_actors0, auth:$auth,this_update_actedIn0_actors0_name:$this_update_actedIn0_actors0_name})
            YIELD value as _
            WITH this, this_actedIn0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this_actedIn0)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN count(*)
            \\", \\"\\", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_actors0_name:$this_update_actedIn0_actors0_name})
            YIELD value as _
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Series)
            WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
            CALL apoc.do.when(this_actedIn0 IS NOT NULL, \\"
            WITH this, this_actedIn0
            OPTIONAL MATCH (this_actedIn0)<-[this_actedIn0_acted_in0_relationship:ACTED_IN]-(this_actedIn0_actors0:Actor)
            CALL apoc.do.when(this_actedIn0_actors0 IS NOT NULL, \\\\\\"
            SET this_actedIn0_actors0.name = $this_update_actedIn0_actors0_name
            RETURN count(*)
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_actedIn0:this_actedIn0, updateActors: $updateActors, this_actedIn0_actors0:this_actedIn0_actors0, auth:$auth,this_update_actedIn0_actors0_name:$this_update_actedIn0_actors0_name})
            YIELD value as _
            WITH this, this_actedIn0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this_actedIn0)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDSeries.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN count(*)
            \\", \\"\\", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_actors0_name:$this_update_actedIn0_actors0_name})
            YIELD value as _
            RETURN count(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_actedIn0_actors0_name\\": \\"New Actor Name\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                },
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actedIn\\": [
                                {
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"actors\\": [
                                                {
                                                    \\"update\\": {
                                                        \\"node\\": {
                                                            \\"name\\": \\"New Actor Name\\"
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title\\": \\"Old Title\\"
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

    test("Update update an interface relationship with nested update using _on to only update one implementation", async () => {
        const query = gql`
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            where: { node: { title: "Old Title" } }
                            update: {
                                node: { _on: { Movie: { actors: { update: { node: { name: "New Actor Name" } } } } } }
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
            OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
            WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
            CALL apoc.do.when(this_actedIn0 IS NOT NULL, \\"
            WITH this, this_actedIn0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this_actedIn0)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            WITH this, this_actedIn0
            OPTIONAL MATCH (this_actedIn0)<-[this_actedIn0_acted_in0_relationship:ACTED_IN]-(this_actedIn0_actors0:Actor)
            CALL apoc.do.when(this_actedIn0_actors0 IS NOT NULL, \\\\\\"
            SET this_actedIn0_actors0.name = $this_update_actedIn0_on_Movie_actors0_name
            RETURN count(*)
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_actedIn0:this_actedIn0, updateActors: $updateActors, this_actedIn0_actors0:this_actedIn0_actors0, auth:$auth,this_update_actedIn0_on_Movie_actors0_name:$this_update_actedIn0_on_Movie_actors0_name})
            YIELD value as _
            WITH this, this_actedIn0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this_actedIn0)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN count(*)
            \\", \\"\\", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_on_Movie_actors0_name:$this_update_actedIn0_on_Movie_actors0_name})
            YIELD value as _
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Series)
            WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
            CALL apoc.do.when(this_actedIn0 IS NOT NULL, \\"
            WITH this, this_actedIn0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this_actedIn0)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDSeries.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN count(*)
            \\", \\"\\", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth})
            YIELD value as _
            RETURN count(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                },
                \\"this_update_actedIn0_on_Movie_actors0_name\\": \\"New Actor Name\\",
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actedIn\\": [
                                {
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"_on\\": {
                                                \\"Movie\\": {
                                                    \\"actors\\": [
                                                        {
                                                            \\"update\\": {
                                                                \\"node\\": {
                                                                    \\"name\\": \\"New Actor Name\\"
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title\\": \\"Old Title\\"
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

    test("Update update an interface relationship with nested update using _on to override update", async () => {
        const query = gql`
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            where: { node: { title: "Old Title" } }
                            update: {
                                node: {
                                    actors: { update: { node: { name: "New Actor Name" } } }
                                    _on: { Movie: { actors: { update: { node: { name: "Different Actor Name" } } } } }
                                }
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
            OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
            WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
            CALL apoc.do.when(this_actedIn0 IS NOT NULL, \\"
            WITH this, this_actedIn0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this_actedIn0)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            WITH this, this_actedIn0
            OPTIONAL MATCH (this_actedIn0)<-[this_actedIn0_acted_in0_relationship:ACTED_IN]-(this_actedIn0_actors0:Actor)
            CALL apoc.do.when(this_actedIn0_actors0 IS NOT NULL, \\\\\\"
            SET this_actedIn0_actors0.name = $this_update_actedIn0_on_Movie_actors0_name
            RETURN count(*)
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_actedIn0:this_actedIn0, updateActors: $updateActors, this_actedIn0_actors0:this_actedIn0_actors0, auth:$auth,this_update_actedIn0_on_Movie_actors0_name:$this_update_actedIn0_on_Movie_actors0_name})
            YIELD value as _
            WITH this, this_actedIn0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this_actedIn0)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN count(*)
            \\", \\"\\", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_on_Movie_actors0_name:$this_update_actedIn0_on_Movie_actors0_name})
            YIELD value as _
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Series)
            WHERE this_actedIn0.title = $updateActors.args.update.actedIn[0].where.node.title
            CALL apoc.do.when(this_actedIn0 IS NOT NULL, \\"
            WITH this, this_actedIn0
            OPTIONAL MATCH (this_actedIn0)<-[this_actedIn0_acted_in0_relationship:ACTED_IN]-(this_actedIn0_actors0:Actor)
            CALL apoc.do.when(this_actedIn0_actors0 IS NOT NULL, \\\\\\"
            SET this_actedIn0_actors0.name = $this_update_actedIn0_actors0_name
            RETURN count(*)
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_actedIn0:this_actedIn0, updateActors: $updateActors, this_actedIn0_actors0:this_actedIn0_actors0, auth:$auth,this_update_actedIn0_actors0_name:$this_update_actedIn0_actors0_name})
            YIELD value as _
            WITH this, this_actedIn0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this_actedIn0)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDSeries.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN count(*)
            \\", \\"\\", {this:this, updateActors: $updateActors, this_actedIn0:this_actedIn0, auth:$auth,this_update_actedIn0_actors0_name:$this_update_actedIn0_actors0_name})
            YIELD value as _
            RETURN count(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                },
                \\"this_update_actedIn0_on_Movie_actors0_name\\": \\"Different Actor Name\\",
                \\"this_update_actedIn0_actors0_name\\": \\"New Actor Name\\",
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actedIn\\": [
                                {
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"_on\\": {
                                                \\"Movie\\": {
                                                    \\"actors\\": [
                                                        {
                                                            \\"update\\": {
                                                                \\"node\\": {
                                                                    \\"name\\": \\"Different Actor Name\\"
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            \\"actors\\": [
                                                {
                                                    \\"update\\": {
                                                        \\"node\\": {
                                                            \\"name\\": \\"New Actor Name\\"
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title\\": \\"Old Title\\"
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

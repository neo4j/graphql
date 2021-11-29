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

describe("Interface Relationships - Update delete", () => {
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

    test("Update delete an interface relationship", async () => {
        const query = gql`
            mutation {
                updateActors(delete: { actedIn: { where: { node: { title_STARTS_WITH: "The " } } } }) {
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
            OPTIONAL MATCH (this)-[this_delete_actedIn_Movie0_relationship:ACTED_IN]->(this_delete_actedIn_Movie0:Movie)
            WHERE this_delete_actedIn_Movie0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
            WITH this, this_delete_actedIn_Movie0, collect(DISTINCT this_delete_actedIn_Movie0) as this_delete_actedIn_Movie0_to_delete, [ metaVal IN [{type: 'Deleted', name: 'Movie', id: id(this_delete_actedIn_Movie0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_delete_actedIn_Movie0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            OPTIONAL MATCH (this)-[this_delete_actedIn_Series0_relationship:ACTED_IN]->(this_delete_actedIn_Series0:Series)
            WHERE this_delete_actedIn_Series0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
            WITH this, this_delete_actedIn_Series0, collect(DISTINCT this_delete_actedIn_Series0) as this_delete_actedIn_Series0_to_delete, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'Series', id: id(this_delete_actedIn_Series0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_delete_actedIn_Series0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            RETURN mutateMeta, this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"delete\\": {
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

    test("Update delete an interface relationship with nested delete", async () => {
        const query = gql`
            mutation {
                updateActors(
                    delete: {
                        actedIn: {
                            where: { node: { title_STARTS_WITH: "The " } }
                            delete: { actors: { where: { node: { name: "Actor" } } } }
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
            OPTIONAL MATCH (this)-[this_delete_actedIn_Movie0_relationship:ACTED_IN]->(this_delete_actedIn_Movie0:Movie)
            WHERE this_delete_actedIn_Movie0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
            WITH this, this_delete_actedIn_Movie0, collect(DISTINCT this_delete_actedIn_Movie0) as this_delete_actedIn_Movie0_to_delete, [ metaVal IN [{type: 'Deleted', name: 'Movie', id: id(this_delete_actedIn_Movie0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            WITH this, this_delete_actedIn_Movie0, this_delete_actedIn_Movie0_to_delete, mutateMeta
            OPTIONAL MATCH (this_delete_actedIn_Movie0)<-[this_delete_actedIn_Movie0_actors0_relationship:ACTED_IN]-(this_delete_actedIn_Movie0_actors0:Actor)
            WHERE this_delete_actedIn_Movie0_actors0.name = $updateActors.args.delete.actedIn[0].delete.actors[0].where.node.name
            WITH this, this_delete_actedIn_Movie0, this_delete_actedIn_Movie0_to_delete, this_delete_actedIn_Movie0_actors0, collect(DISTINCT this_delete_actedIn_Movie0_actors0) as this_delete_actedIn_Movie0_actors0_to_delete, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'Actor', id: id(this_delete_actedIn_Movie0_actors0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_delete_actedIn_Movie0_actors0_to_delete | DETACH DELETE x)
            WITH this, this_delete_actedIn_Movie0, this_delete_actedIn_Movie0_to_delete, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            FOREACH(x IN this_delete_actedIn_Movie0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            OPTIONAL MATCH (this)-[this_delete_actedIn_Series0_relationship:ACTED_IN]->(this_delete_actedIn_Series0:Series)
            WHERE this_delete_actedIn_Series0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
            WITH this, this_delete_actedIn_Series0, collect(DISTINCT this_delete_actedIn_Series0) as this_delete_actedIn_Series0_to_delete, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'Series', id: id(this_delete_actedIn_Series0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            WITH this, this_delete_actedIn_Series0, this_delete_actedIn_Series0_to_delete, mutateMeta
            OPTIONAL MATCH (this_delete_actedIn_Series0)<-[this_delete_actedIn_Series0_actors0_relationship:ACTED_IN]-(this_delete_actedIn_Series0_actors0:Actor)
            WHERE this_delete_actedIn_Series0_actors0.name = $updateActors.args.delete.actedIn[0].delete.actors[0].where.node.name
            WITH this, this_delete_actedIn_Series0, this_delete_actedIn_Series0_to_delete, this_delete_actedIn_Series0_actors0, collect(DISTINCT this_delete_actedIn_Series0_actors0) as this_delete_actedIn_Series0_actors0_to_delete, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'Actor', id: id(this_delete_actedIn_Series0_actors0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_delete_actedIn_Series0_actors0_to_delete | DETACH DELETE x)
            WITH this, this_delete_actedIn_Series0, this_delete_actedIn_Series0_to_delete, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            FOREACH(x IN this_delete_actedIn_Series0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            RETURN mutateMeta, this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actedIn\\": [
                                {
                                    \\"delete\\": {
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

    test("Update delete an interface relationship with nested delete using _on to delete from only one implementation", async () => {
        const query = gql`
            mutation {
                updateActors(
                    delete: {
                        actedIn: {
                            where: { node: { title_STARTS_WITH: "The " } }
                            delete: { _on: { Movie: { actors: { where: { node: { name: "Actor" } } } } } }
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
            OPTIONAL MATCH (this)-[this_delete_actedIn_Movie0_relationship:ACTED_IN]->(this_delete_actedIn_Movie0:Movie)
            WHERE this_delete_actedIn_Movie0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
            WITH this, this_delete_actedIn_Movie0, collect(DISTINCT this_delete_actedIn_Movie0) as this_delete_actedIn_Movie0_to_delete, [ metaVal IN [{type: 'Deleted', name: 'Movie', id: id(this_delete_actedIn_Movie0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            WITH this, this_delete_actedIn_Movie0, this_delete_actedIn_Movie0_to_delete, mutateMeta
            OPTIONAL MATCH (this_delete_actedIn_Movie0)<-[this_delete_actedIn_Movie0_actors0_relationship:ACTED_IN]-(this_delete_actedIn_Movie0_actors0:Actor)
            WHERE this_delete_actedIn_Movie0_actors0.name = $updateActors.args.delete.actedIn[0].delete._on.Movie[0].actors[0].where.node.name
            WITH this, this_delete_actedIn_Movie0, this_delete_actedIn_Movie0_to_delete, this_delete_actedIn_Movie0_actors0, collect(DISTINCT this_delete_actedIn_Movie0_actors0) as this_delete_actedIn_Movie0_actors0_to_delete, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'Actor', id: id(this_delete_actedIn_Movie0_actors0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_delete_actedIn_Movie0_actors0_to_delete | DETACH DELETE x)
            WITH this, this_delete_actedIn_Movie0, this_delete_actedIn_Movie0_to_delete, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            FOREACH(x IN this_delete_actedIn_Movie0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            OPTIONAL MATCH (this)-[this_delete_actedIn_Series0_relationship:ACTED_IN]->(this_delete_actedIn_Series0:Series)
            WHERE this_delete_actedIn_Series0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
            WITH this, this_delete_actedIn_Series0, collect(DISTINCT this_delete_actedIn_Series0) as this_delete_actedIn_Series0_to_delete, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'Series', id: id(this_delete_actedIn_Series0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_delete_actedIn_Series0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            RETURN mutateMeta, this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actedIn\\": [
                                {
                                    \\"delete\\": {
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

    test("Update delete an interface relationship with nested delete using _on to override deletion", async () => {
        const query = gql`
            mutation {
                updateActors(
                    delete: {
                        actedIn: {
                            where: { node: { title_STARTS_WITH: "The " } }
                            delete: {
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
            OPTIONAL MATCH (this)-[this_delete_actedIn_Movie0_relationship:ACTED_IN]->(this_delete_actedIn_Movie0:Movie)
            WHERE this_delete_actedIn_Movie0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
            WITH this, this_delete_actedIn_Movie0, collect(DISTINCT this_delete_actedIn_Movie0) as this_delete_actedIn_Movie0_to_delete, [ metaVal IN [{type: 'Deleted', name: 'Movie', id: id(this_delete_actedIn_Movie0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            WITH this, this_delete_actedIn_Movie0, this_delete_actedIn_Movie0_to_delete, mutateMeta
            OPTIONAL MATCH (this_delete_actedIn_Movie0)<-[this_delete_actedIn_Movie0_actors0_relationship:ACTED_IN]-(this_delete_actedIn_Movie0_actors0:Actor)
            WHERE this_delete_actedIn_Movie0_actors0.name = $updateActors.args.delete.actedIn[0].delete._on.Movie[0].actors[0].where.node.name
            WITH this, this_delete_actedIn_Movie0, this_delete_actedIn_Movie0_to_delete, this_delete_actedIn_Movie0_actors0, collect(DISTINCT this_delete_actedIn_Movie0_actors0) as this_delete_actedIn_Movie0_actors0_to_delete, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'Actor', id: id(this_delete_actedIn_Movie0_actors0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_delete_actedIn_Movie0_actors0_to_delete | DETACH DELETE x)
            WITH this, this_delete_actedIn_Movie0, this_delete_actedIn_Movie0_to_delete, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            FOREACH(x IN this_delete_actedIn_Movie0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            OPTIONAL MATCH (this)-[this_delete_actedIn_Series0_relationship:ACTED_IN]->(this_delete_actedIn_Series0:Series)
            WHERE this_delete_actedIn_Series0.title STARTS WITH $updateActors.args.delete.actedIn[0].where.node.title_STARTS_WITH
            WITH this, this_delete_actedIn_Series0, collect(DISTINCT this_delete_actedIn_Series0) as this_delete_actedIn_Series0_to_delete, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'Series', id: id(this_delete_actedIn_Series0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            WITH this, this_delete_actedIn_Series0, this_delete_actedIn_Series0_to_delete, mutateMeta
            OPTIONAL MATCH (this_delete_actedIn_Series0)<-[this_delete_actedIn_Series0_actors0_relationship:ACTED_IN]-(this_delete_actedIn_Series0_actors0:Actor)
            WHERE this_delete_actedIn_Series0_actors0.name = $updateActors.args.delete.actedIn[0].delete.actors[0].where.node.name
            WITH this, this_delete_actedIn_Series0, this_delete_actedIn_Series0_to_delete, this_delete_actedIn_Series0_actors0, collect(DISTINCT this_delete_actedIn_Series0_actors0) as this_delete_actedIn_Series0_actors0_to_delete, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'Actor', id: id(this_delete_actedIn_Series0_actors0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_delete_actedIn_Series0_actors0_to_delete | DETACH DELETE x)
            WITH this, this_delete_actedIn_Series0, this_delete_actedIn_Series0_to_delete, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            FOREACH(x IN this_delete_actedIn_Series0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            RETURN mutateMeta, this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actedIn\\": [
                                {
                                    \\"delete\\": {
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

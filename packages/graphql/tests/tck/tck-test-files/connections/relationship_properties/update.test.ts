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

describe("Cypher -> Connections -> Relationship Properties -> Update", () => {
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

    test("Update a relationship property on a relationship between two specified nodes (update -> update)", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { title: "Forrest Gump" }
                    update: {
                        actors: [{ where: { node: { name: "Tom Hanks" } }, update: { edge: { screenTime: 60 } } }]
                    }
                ) {
                    movies {
                        title
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
            WITH this
            OPTIONAL MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name
            CALL apoc.do.when(this_acted_in0_relationship IS NOT NULL, \\"
            SET this_acted_in0_relationship.screenTime = $updateMovies.args.update.actors[0].update.edge.screenTime
            RETURN this, this_actors0, this_acted_in0_relationship, [ metaVal IN [{type: 'RelationshipUpdated', name: 'Movie', relationshipName: 'ACTED_IN', toName: 'Actor', id: id(this), relationshipID: id(this_acted_in0_relationship), toID: id(this_actors0), properties: $updateMovies.args.update.actors[0].update.edge}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            \\", \\"\\", {this_acted_in0_relationship:this_acted_in0_relationship, updateMovies: $updateMovies, this:this, this_actors0:this_actors0, this_acted_in0_relationship:this_acted_in0_relationship})
            YIELD value as this_acted_in0_relationship_actors0_edge
            WITH this, this_actors0, this_acted_in0_relationship, this_acted_in0_relationship_actors0_edge.mutateMeta as mutateMeta
            WITH this, mutateMeta
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN mutateMeta, this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Tom Hanks\\"
                                        }
                                    },
                                    \\"update\\": {
                                        \\"edge\\": {
                                            \\"screenTime\\": {
                                                \\"low\\": 60,
                                                \\"high\\": 0
                                            }
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

    test("Update properties on both the relationship and end node in a nested update (update -> update)", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { title: "Forrest Gump" }
                    update: {
                        actors: [
                            {
                                where: { node: { name: "Tom Hanks" } }
                                update: { edge: { screenTime: 60 }, node: { name: "Tom Hanks" } }
                            }
                        ]
                    }
                ) {
                    movies {
                        title
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
            WITH this
            OPTIONAL MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name
            CALL apoc.do.when(this_actors0 IS NOT NULL, \\"
            SET this_actors0.name = $this_update_actors0_name
            WITH this, this_actors0, this_acted_in0_relationship, [ metaVal IN [{type: 'Updated', name: 'Actor', id: id(this_actors0), properties: $this_update_actors0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this_actors0)-[:ACTED_IN]->(:Movie))), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.movies required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN this, this_actors0, this_acted_in0_relationship, mutateMeta
            \\", \\"\\", {this:this, this_actors0:this_actors0, this_acted_in0_relationship:this_acted_in0_relationship, updateMovies: $updateMovies, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name,this_update_actors0:$this_update_actors0})
            YIELD value
            WITH this, this_actors0, this_acted_in0_relationship, value.mutateMeta as mutateMeta
            CALL apoc.do.when(this_acted_in0_relationship IS NOT NULL, \\"
            SET this_acted_in0_relationship.screenTime = $updateMovies.args.update.actors[0].update.edge.screenTime
            RETURN this, this_actors0, this_acted_in0_relationship, [ metaVal IN [{type: 'RelationshipUpdated', name: 'Movie', relationshipName: 'ACTED_IN', toName: 'Actor', id: id(this), relationshipID: id(this_acted_in0_relationship), toID: id(this_actors0), properties: $updateMovies.args.update.actors[0].update.edge}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            \\", \\"\\", {this_acted_in0_relationship:this_acted_in0_relationship, updateMovies: $updateMovies, this:this, this_actors0:this_actors0, this_acted_in0_relationship:this_acted_in0_relationship})
            YIELD value as this_acted_in0_relationship_actors0_edge
            WITH this, this_actors0, this_acted_in0_relationship, mutateMeta + this_acted_in0_relationship_actors0_edge.mutateMeta as mutateMeta
            WITH this, mutateMeta
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this)<-[:ACTED_IN]-(:Actor))), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.actors required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN mutateMeta, this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"Forrest Gump\\",
                \\"this_update_actors0_name\\": \\"Tom Hanks\\",
                \\"this_update_actors0\\": {
                    \\"name\\": \\"Tom Hanks\\"
                },
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                },
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Tom Hanks\\"
                                        }
                                    },
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Tom Hanks\\"
                                        },
                                        \\"edge\\": {
                                            \\"screenTime\\": {
                                                \\"low\\": 60,
                                                \\"high\\": 0
                                            }
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

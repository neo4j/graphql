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

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Interface Relationships - Update delete", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Production @node {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production @node {
                title: String!
                episodes: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Update delete an interface relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(update: { actedIn: { delete: { where: { node: { title_STARTS_WITH: "The " } } } } }) {
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH this
            CALL {
            	 WITH this
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_actedIn0_delete0_relationship:ACTED_IN]->(this_actedIn0_delete0:Movie)
            WHERE this_actedIn0_delete0.title STARTS WITH $updateActors_args_update_actedIn0_delete0_where_this_actedIn0_delete0param0
            WITH this_actedIn0_delete0_relationship, collect(DISTINCT this_actedIn0_delete0) AS this_actedIn0_delete0_to_delete
            CALL {
            	WITH this_actedIn0_delete0_to_delete
            	UNWIND this_actedIn0_delete0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_actedIn0_delete0_relationship:ACTED_IN]->(this_actedIn0_delete0:Series)
            WHERE this_actedIn0_delete0.title STARTS WITH $updateActors_args_update_actedIn0_delete0_where_this_actedIn0_delete0param0
            WITH this_actedIn0_delete0_relationship, collect(DISTINCT this_actedIn0_delete0) AS this_actedIn0_delete0_to_delete
            CALL {
            	WITH this_actedIn0_delete0_to_delete
            	UNWIND this_actedIn0_delete0_to_delete AS x
            	DETACH DELETE x
            }
            }
            RETURN count(*) AS update_this_Movie
            }
            CALL {
            	 WITH this
            	WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_actedIn0_delete0_relationship:ACTED_IN]->(this_actedIn0_delete0:Movie)
            WHERE this_actedIn0_delete0.title STARTS WITH $updateActors_args_update_actedIn0_delete0_where_this_actedIn0_delete0param0
            WITH this_actedIn0_delete0_relationship, collect(DISTINCT this_actedIn0_delete0) AS this_actedIn0_delete0_to_delete
            CALL {
            	WITH this_actedIn0_delete0_to_delete
            	UNWIND this_actedIn0_delete0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_actedIn0_delete0_relationship:ACTED_IN]->(this_actedIn0_delete0:Series)
            WHERE this_actedIn0_delete0.title STARTS WITH $updateActors_args_update_actedIn0_delete0_where_this_actedIn0_delete0param0
            WITH this_actedIn0_delete0_relationship, collect(DISTINCT this_actedIn0_delete0) AS this_actedIn0_delete0_to_delete
            CALL {
            	WITH this_actedIn0_delete0_to_delete
            	UNWIND this_actedIn0_delete0_to_delete AS x
            	DETACH DELETE x
            }
            }
            RETURN count(*) AS update_this_Series
            }
            RETURN collect(DISTINCT this { .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors_args_update_actedIn0_delete0_where_this_actedIn0_delete0param0\\": \\"The \\",
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actedIn\\": [
                                {
                                    \\"delete\\": [
                                        {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"title_STARTS_WITH\\": \\"The \\"
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update delete an interface relationship with nested delete", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    update: {
                        actedIn: {
                            delete: {
                                where: { node: { title_STARTS_WITH: "The " } }
                                delete: { actors: { where: { node: { name_EQ: "Actor" } } } }
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH this
            CALL {
            	 WITH this
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_actedIn0_delete0_relationship:ACTED_IN]->(this_actedIn0_delete0:Movie)
            WHERE this_actedIn0_delete0.title STARTS WITH $updateActors_args_update_actedIn0_delete0_where_this_actedIn0_delete0param0
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this_actedIn0_delete0)<-[this_actedIn0_delete0_actors0_relationship:ACTED_IN]-(this_actedIn0_delete0_actors0:Actor)
            WHERE this_actedIn0_delete0_actors0.name = $updateActors_args_update_actedIn0_delete0_delete_actors0_where_this_actedIn0_delete0_actors0param0
            WITH this_actedIn0_delete0_actors0_relationship, collect(DISTINCT this_actedIn0_delete0_actors0) AS this_actedIn0_delete0_actors0_to_delete
            CALL {
            	WITH this_actedIn0_delete0_actors0_to_delete
            	UNWIND this_actedIn0_delete0_actors0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH this_actedIn0_delete0_relationship, collect(DISTINCT this_actedIn0_delete0) AS this_actedIn0_delete0_to_delete
            CALL {
            	WITH this_actedIn0_delete0_to_delete
            	UNWIND this_actedIn0_delete0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_actedIn0_delete0_relationship:ACTED_IN]->(this_actedIn0_delete0:Series)
            WHERE this_actedIn0_delete0.title STARTS WITH $updateActors_args_update_actedIn0_delete0_where_this_actedIn0_delete0param0
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this_actedIn0_delete0)<-[this_actedIn0_delete0_actors0_relationship:ACTED_IN]-(this_actedIn0_delete0_actors0:Actor)
            WHERE this_actedIn0_delete0_actors0.name = $updateActors_args_update_actedIn0_delete0_delete_actors0_where_this_actedIn0_delete0_actors0param0
            WITH this_actedIn0_delete0_actors0_relationship, collect(DISTINCT this_actedIn0_delete0_actors0) AS this_actedIn0_delete0_actors0_to_delete
            CALL {
            	WITH this_actedIn0_delete0_actors0_to_delete
            	UNWIND this_actedIn0_delete0_actors0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH this_actedIn0_delete0_relationship, collect(DISTINCT this_actedIn0_delete0) AS this_actedIn0_delete0_to_delete
            CALL {
            	WITH this_actedIn0_delete0_to_delete
            	UNWIND this_actedIn0_delete0_to_delete AS x
            	DETACH DELETE x
            }
            }
            RETURN count(*) AS update_this_Movie
            }
            CALL {
            	 WITH this
            	WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_actedIn0_delete0_relationship:ACTED_IN]->(this_actedIn0_delete0:Movie)
            WHERE this_actedIn0_delete0.title STARTS WITH $updateActors_args_update_actedIn0_delete0_where_this_actedIn0_delete0param0
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this_actedIn0_delete0)<-[this_actedIn0_delete0_actors0_relationship:ACTED_IN]-(this_actedIn0_delete0_actors0:Actor)
            WHERE this_actedIn0_delete0_actors0.name = $updateActors_args_update_actedIn0_delete0_delete_actors0_where_this_actedIn0_delete0_actors0param0
            WITH this_actedIn0_delete0_actors0_relationship, collect(DISTINCT this_actedIn0_delete0_actors0) AS this_actedIn0_delete0_actors0_to_delete
            CALL {
            	WITH this_actedIn0_delete0_actors0_to_delete
            	UNWIND this_actedIn0_delete0_actors0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH this_actedIn0_delete0_relationship, collect(DISTINCT this_actedIn0_delete0) AS this_actedIn0_delete0_to_delete
            CALL {
            	WITH this_actedIn0_delete0_to_delete
            	UNWIND this_actedIn0_delete0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_actedIn0_delete0_relationship:ACTED_IN]->(this_actedIn0_delete0:Series)
            WHERE this_actedIn0_delete0.title STARTS WITH $updateActors_args_update_actedIn0_delete0_where_this_actedIn0_delete0param0
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this_actedIn0_delete0)<-[this_actedIn0_delete0_actors0_relationship:ACTED_IN]-(this_actedIn0_delete0_actors0:Actor)
            WHERE this_actedIn0_delete0_actors0.name = $updateActors_args_update_actedIn0_delete0_delete_actors0_where_this_actedIn0_delete0_actors0param0
            WITH this_actedIn0_delete0_actors0_relationship, collect(DISTINCT this_actedIn0_delete0_actors0) AS this_actedIn0_delete0_actors0_to_delete
            CALL {
            	WITH this_actedIn0_delete0_actors0_to_delete
            	UNWIND this_actedIn0_delete0_actors0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH this_actedIn0_delete0_relationship, collect(DISTINCT this_actedIn0_delete0) AS this_actedIn0_delete0_to_delete
            CALL {
            	WITH this_actedIn0_delete0_to_delete
            	UNWIND this_actedIn0_delete0_to_delete AS x
            	DETACH DELETE x
            }
            }
            RETURN count(*) AS update_this_Series
            }
            RETURN collect(DISTINCT this { .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors_args_update_actedIn0_delete0_where_this_actedIn0_delete0param0\\": \\"The \\",
                \\"updateActors_args_update_actedIn0_delete0_delete_actors0_where_this_actedIn0_delete0_actors0param0\\": \\"Actor\\",
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actedIn\\": [
                                {
                                    \\"delete\\": [
                                        {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"title_STARTS_WITH\\": \\"The \\"
                                                }
                                            },
                                            \\"delete\\": {
                                                \\"actors\\": [
                                                    {
                                                        \\"where\\": {
                                                            \\"node\\": {
                                                                \\"name_EQ\\": \\"Actor\\"
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

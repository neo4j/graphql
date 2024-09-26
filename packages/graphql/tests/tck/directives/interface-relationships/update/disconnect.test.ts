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

describe("Interface Relationships - Update disconnect", () => {
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

    test("Update disconnect from an interface relationship", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(disconnect: { actedIn: { where: { node: { title_STARTS_WITH: "The " } } } }) {
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
            OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Movie)
            WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors_args_disconnect_actedIn0_where_Movie_this_disconnect_actedIn0param0
            CALL {
            	WITH this_disconnect_actedIn0, this_disconnect_actedIn0_rel, this
            	WITH collect(this_disconnect_actedIn0) as this_disconnect_actedIn0, this_disconnect_actedIn0_rel, this
            	UNWIND this_disconnect_actedIn0 as x
            	DELETE this_disconnect_actedIn0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_actedIn_Movie
            }
            CALL {
            	WITH this
            OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Series)
            WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors_args_disconnect_actedIn0_where_Series_this_disconnect_actedIn0param0
            CALL {
            	WITH this_disconnect_actedIn0, this_disconnect_actedIn0_rel, this
            	WITH collect(this_disconnect_actedIn0) as this_disconnect_actedIn0, this_disconnect_actedIn0_rel, this
            	UNWIND this_disconnect_actedIn0 as x
            	DELETE this_disconnect_actedIn0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_actedIn_Series
            }
            WITH *
            RETURN collect(DISTINCT this { .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors_args_disconnect_actedIn0_where_Movie_this_disconnect_actedIn0param0\\": \\"The \\",
                \\"updateActors_args_disconnect_actedIn0_where_Series_this_disconnect_actedIn0param0\\": \\"The \\",
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
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update disconnect from an interface relationship with nested disconnect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateActors(
                    disconnect: {
                        actedIn: {
                            where: { node: { title_STARTS_WITH: "The " } }
                            disconnect: { actors: { where: { node: { name_EQ: "Actor" } } } }
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
            OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Movie)
            WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors_args_disconnect_actedIn0_where_Movie_this_disconnect_actedIn0param0
            CALL {
            	WITH this_disconnect_actedIn0, this_disconnect_actedIn0_rel, this
            	WITH collect(this_disconnect_actedIn0) as this_disconnect_actedIn0, this_disconnect_actedIn0_rel, this
            	UNWIND this_disconnect_actedIn0 as x
            	DELETE this_disconnect_actedIn0_rel
            }
            CALL {
            WITH this, this_disconnect_actedIn0
            OPTIONAL MATCH (this_disconnect_actedIn0)<-[this_disconnect_actedIn0_actors0_rel:ACTED_IN]-(this_disconnect_actedIn0_actors0:Actor)
            WHERE this_disconnect_actedIn0_actors0.name = $updateActors_args_disconnect_actedIn0_disconnect_actors0_where_Actor_this_disconnect_actedIn0_actors0param0
            CALL {
            	WITH this_disconnect_actedIn0_actors0, this_disconnect_actedIn0_actors0_rel, this_disconnect_actedIn0
            	WITH collect(this_disconnect_actedIn0_actors0) as this_disconnect_actedIn0_actors0, this_disconnect_actedIn0_actors0_rel, this_disconnect_actedIn0
            	UNWIND this_disconnect_actedIn0_actors0 as x
            	DELETE this_disconnect_actedIn0_actors0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_actedIn0_actors_Actor
            }
            RETURN count(*) AS disconnect_this_disconnect_actedIn_Movie
            }
            CALL {
            	WITH this
            OPTIONAL MATCH (this)-[this_disconnect_actedIn0_rel:ACTED_IN]->(this_disconnect_actedIn0:Series)
            WHERE this_disconnect_actedIn0.title STARTS WITH $updateActors_args_disconnect_actedIn0_where_Series_this_disconnect_actedIn0param0
            CALL {
            	WITH this_disconnect_actedIn0, this_disconnect_actedIn0_rel, this
            	WITH collect(this_disconnect_actedIn0) as this_disconnect_actedIn0, this_disconnect_actedIn0_rel, this
            	UNWIND this_disconnect_actedIn0 as x
            	DELETE this_disconnect_actedIn0_rel
            }
            CALL {
            WITH this, this_disconnect_actedIn0
            OPTIONAL MATCH (this_disconnect_actedIn0)<-[this_disconnect_actedIn0_actors0_rel:ACTED_IN]-(this_disconnect_actedIn0_actors0:Actor)
            WHERE this_disconnect_actedIn0_actors0.name = $updateActors_args_disconnect_actedIn0_disconnect_actors0_where_Actor_this_disconnect_actedIn0_actors0param0
            CALL {
            	WITH this_disconnect_actedIn0_actors0, this_disconnect_actedIn0_actors0_rel, this_disconnect_actedIn0
            	WITH collect(this_disconnect_actedIn0_actors0) as this_disconnect_actedIn0_actors0, this_disconnect_actedIn0_actors0_rel, this_disconnect_actedIn0
            	UNWIND this_disconnect_actedIn0_actors0 as x
            	DELETE this_disconnect_actedIn0_actors0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_actedIn0_actors_Actor
            }
            RETURN count(*) AS disconnect_this_disconnect_actedIn_Series
            }
            WITH *
            RETURN collect(DISTINCT this { .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateActors_args_disconnect_actedIn0_where_Movie_this_disconnect_actedIn0param0\\": \\"The \\",
                \\"updateActors_args_disconnect_actedIn0_disconnect_actors0_where_Actor_this_disconnect_actedIn0_actors0param0\\": \\"Actor\\",
                \\"updateActors_args_disconnect_actedIn0_where_Series_this_disconnect_actedIn0param0\\": \\"The \\",
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"actedIn\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"title_STARTS_WITH\\": \\"The \\"
                                        }
                                    },
                                    \\"disconnect\\": {
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
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

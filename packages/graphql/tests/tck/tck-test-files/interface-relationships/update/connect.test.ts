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

describe("Interface Relationships - Update connect", () => {
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

    test("Update connect to an interface relationship", async () => {
        const query = gql`
            mutation {
                updateActors(
                    connect: { actedIn: { edge: { screenTime: 90 }, where: { node: { title_STARTS_WITH: "The " } } } }
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
            	OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
            	WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
            		)
            	)
            	RETURN count(*)
            UNION
            	WITH this
            	OPTIONAL MATCH (this_connect_actedIn0_node:Series)
            	WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
            		)
            	)
            	RETURN count(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connect_actedIn0_node_title_STARTS_WITH\\": \\"The \\",
                \\"this_connect_actedIn0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Update connect to an interface relationship and nested connect", async () => {
        const query = gql`
            mutation {
                updateActors(
                    connect: {
                        actedIn: {
                            edge: { screenTime: 90 }
                            where: { node: { title_STARTS_WITH: "The " } }
                            connect: { actors: { edge: { screenTime: 90 }, where: { node: { name: "Actor" } } } }
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
            	OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
            	WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
            		)
            	)
            WITH this, this_connect_actedIn0_node
            CALL {
            	WITH this, this_connect_actedIn0_node
            	OPTIONAL MATCH (this_connect_actedIn0_node_actors0_node:Actor)
            	WHERE this_connect_actedIn0_node_actors0_node.name = $this_connect_actedIn0_node_actors0_node_name
            	FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node_actors0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_actors0_node)
            SET this_connect_actedIn0_node_actors0_relationship.screenTime = $this_connect_actedIn0_node_actors0_relationship_screenTime
            		)
            	)
            	RETURN count(*)
            }
            	RETURN count(*)
            UNION
            	WITH this
            	OPTIONAL MATCH (this_connect_actedIn0_node:Series)
            	WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
            		)
            	)
            WITH this, this_connect_actedIn0_node
            CALL {
            	WITH this, this_connect_actedIn0_node
            	OPTIONAL MATCH (this_connect_actedIn0_node_actors0_node:Actor)
            	WHERE this_connect_actedIn0_node_actors0_node.name = $this_connect_actedIn0_node_actors0_node_name
            	FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node_actors0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_actors0_node)
            SET this_connect_actedIn0_node_actors0_relationship.screenTime = $this_connect_actedIn0_node_actors0_relationship_screenTime
            		)
            	)
            	RETURN count(*)
            }
            	RETURN count(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connect_actedIn0_node_title_STARTS_WITH\\": \\"The \\",
                \\"this_connect_actedIn0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn0_node_actors0_node_name\\": \\"Actor\\",
                \\"this_connect_actedIn0_node_actors0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Update connect to an interface relationship and nested connect using _on to connect only one implementation", async () => {
        const query = gql`
            mutation {
                updateActors(
                    connect: {
                        actedIn: {
                            edge: { screenTime: 90 }
                            where: { node: { title_STARTS_WITH: "The " } }
                            connect: {
                                _on: {
                                    Movie: { actors: { edge: { screenTime: 90 }, where: { node: { name: "Actor" } } } }
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
            	OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
            	WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
            		)
            	)
            WITH this, this_connect_actedIn0_node
            CALL {
            	WITH this, this_connect_actedIn0_node
            	OPTIONAL MATCH (this_connect_actedIn0_node_on_Movie0_actors0_node:Actor)
            	WHERE this_connect_actedIn0_node_on_Movie0_actors0_node.name = $this_connect_actedIn0_node_on_Movie0_actors0_node_name
            	FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node_on_Movie0_actors0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_on_Movie0_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_on_Movie0_actors0_node)
            SET this_connect_actedIn0_node_on_Movie0_actors0_relationship.screenTime = $this_connect_actedIn0_node_on_Movie0_actors0_relationship_screenTime
            		)
            	)
            	RETURN count(*)
            }
            	RETURN count(*)
            UNION
            	WITH this
            	OPTIONAL MATCH (this_connect_actedIn0_node:Series)
            	WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
            		)
            	)
            	RETURN count(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connect_actedIn0_node_title_STARTS_WITH\\": \\"The \\",
                \\"this_connect_actedIn0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn0_node_on_Movie0_actors0_node_name\\": \\"Actor\\",
                \\"this_connect_actedIn0_node_on_Movie0_actors0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Update connect to an interface relationship and nested connect using _on to override connection", async () => {
        const query = gql`
            mutation {
                updateActors(
                    connect: {
                        actedIn: {
                            edge: { screenTime: 90 }
                            where: { node: { title_STARTS_WITH: "The " } }
                            connect: {
                                actors: { edge: { screenTime: 90 }, where: { node: { name: "Actor" } } }
                                _on: {
                                    Movie: {
                                        actors: {
                                            edge: { screenTime: 90 }
                                            where: { node: { name: "Different Actor" } }
                                        }
                                    }
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
            	OPTIONAL MATCH (this_connect_actedIn0_node:Movie)
            	WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
            		)
            	)
            WITH this, this_connect_actedIn0_node
            CALL {
            	WITH this, this_connect_actedIn0_node
            	OPTIONAL MATCH (this_connect_actedIn0_node_on_Movie0_actors0_node:Actor)
            	WHERE this_connect_actedIn0_node_on_Movie0_actors0_node.name = $this_connect_actedIn0_node_on_Movie0_actors0_node_name
            	FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node_on_Movie0_actors0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_on_Movie0_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_on_Movie0_actors0_node)
            SET this_connect_actedIn0_node_on_Movie0_actors0_relationship.screenTime = $this_connect_actedIn0_node_on_Movie0_actors0_relationship_screenTime
            		)
            	)
            	RETURN count(*)
            }
            	RETURN count(*)
            UNION
            	WITH this
            	OPTIONAL MATCH (this_connect_actedIn0_node:Series)
            	WHERE this_connect_actedIn0_node.title STARTS WITH $this_connect_actedIn0_node_title_STARTS_WITH
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[this_connect_actedIn0_relationship:ACTED_IN]->(this_connect_actedIn0_node)
            SET this_connect_actedIn0_relationship.screenTime = $this_connect_actedIn0_relationship_screenTime
            		)
            	)
            WITH this, this_connect_actedIn0_node
            CALL {
            	WITH this, this_connect_actedIn0_node
            	OPTIONAL MATCH (this_connect_actedIn0_node_actors0_node:Actor)
            	WHERE this_connect_actedIn0_node_actors0_node.name = $this_connect_actedIn0_node_actors0_node_name
            	FOREACH(_ IN CASE this_connect_actedIn0_node WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actedIn0_node_actors0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this_connect_actedIn0_node)<-[this_connect_actedIn0_node_actors0_relationship:ACTED_IN]-(this_connect_actedIn0_node_actors0_node)
            SET this_connect_actedIn0_node_actors0_relationship.screenTime = $this_connect_actedIn0_node_actors0_relationship_screenTime
            		)
            	)
            	RETURN count(*)
            }
            	RETURN count(*)
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connect_actedIn0_node_title_STARTS_WITH\\": \\"The \\",
                \\"this_connect_actedIn0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn0_node_on_Movie0_actors0_node_name\\": \\"Different Actor\\",
                \\"this_connect_actedIn0_node_on_Movie0_actors0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connect_actedIn0_node_actors0_node_name\\": \\"Actor\\",
                \\"this_connect_actedIn0_node_actors0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });
});

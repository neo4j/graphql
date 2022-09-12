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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/832", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Entity {
                id: String!
            }

            type Person implements Entity {
                id: String! @unique
                name: String!
            }

            type Place implements Entity {
                id: String! @unique
                location: Point!
            }

            type Interaction {
                id: ID! @id
                kind: String!
                subjects: [Entity!]! @relationship(type: "ACTED_IN", direction: IN)
                objects: [Entity!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should produce Cypher which doesn't create duplicate nodes, only selecting created nodes", async () => {
        const query = gql`
            mutation {
                createInteractions(
                    input: [
                        {
                            subjects: { connect: { where: { node: { id_IN: ["adam", "eve"] } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id_IN: ["cain"] } } } }
                        }
                        {
                            subjects: { connect: { where: { node: { id_IN: ["adam", "eve"] } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id_IN: ["abel"] } } } }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                    interactions {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Interaction)
            SET this0.id = randomUUID()
            SET this0.kind = $this0_kind
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Person)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_subjects_connect_Person
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Place)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_subjects_connect_Place
            }
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_objects_connect0_node:Person)
            	WHERE this0_objects_connect0_node.id IN $this0_objects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_objects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_objects_connect_Person
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_objects_connect0_node:Place)
            	WHERE this0_objects_connect0_node.id IN $this0_objects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_objects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_objects_connect_Place
            }
            RETURN this0
            }
            CALL {
            CREATE (this1:Interaction)
            SET this1.id = randomUUID()
            SET this1.kind = $this1_kind
            WITH this1
            CALL {
            	WITH this1
            	OPTIONAL MATCH (this1_subjects_connect0_node:Person)
            	WHERE this1_subjects_connect0_node.id IN $this1_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this1 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this1_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this1)<-[:ACTED_IN]-(this1_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this1_subjects_connect_Person
            }
            CALL {
            		WITH this1
            	OPTIONAL MATCH (this1_subjects_connect0_node:Place)
            	WHERE this1_subjects_connect0_node.id IN $this1_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this1 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this1_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this1)<-[:ACTED_IN]-(this1_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this1_subjects_connect_Place
            }
            WITH this1
            CALL {
            	WITH this1
            	OPTIONAL MATCH (this1_objects_connect0_node:Person)
            	WHERE this1_objects_connect0_node.id IN $this1_objects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this1 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this1_objects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this1)-[:ACTED_IN]->(this1_objects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this1_objects_connect_Person
            }
            CALL {
            		WITH this1
            	OPTIONAL MATCH (this1_objects_connect0_node:Place)
            	WHERE this1_objects_connect0_node.id IN $this1_objects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this1 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this1_objects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this1)-[:ACTED_IN]->(this1_objects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this1_objects_connect_Place
            }
            RETURN this1
            }
            RETURN [
            this0 { .id },
            this1 { .id }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_kind\\": \\"PARENT_OF\\",
                \\"this0_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_objects_connect0_node_param0\\": [
                    \\"cain\\"
                ],
                \\"this1_kind\\": \\"PARENT_OF\\",
                \\"this1_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this1_objects_connect0_node_param0\\": [
                    \\"abel\\"
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("should produce Cypher correctly creates one interaction", async () => {
        const query = gql`
            mutation {
                createInteractions(
                    input: [
                        {
                            subjects: { connect: { where: { node: { id_IN: ["adam", "eve"] } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id_IN: ["cain"] } } } }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                    interactions {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Interaction)
            SET this0.id = randomUUID()
            SET this0.kind = $this0_kind
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Person)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_subjects_connect_Person
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Place)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_subjects_connect_Place
            }
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_objects_connect0_node:Person)
            	WHERE this0_objects_connect0_node.id IN $this0_objects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_objects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_objects_connect_Person
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_objects_connect0_node:Place)
            	WHERE this0_objects_connect0_node.id IN $this0_objects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_objects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_objects_connect_Place
            }
            RETURN this0
            }
            RETURN [
            this0 { .id }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_kind\\": \\"PARENT_OF\\",
                \\"this0_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_objects_connect0_node_param0\\": [
                    \\"cain\\"
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("should produce Cypher correctly creates second interaction", async () => {
        const query = gql`
            mutation {
                createInteractions(
                    input: [
                        {
                            subjects: { connect: { where: { node: { id_IN: ["adam", "eve"] } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id_IN: ["abel"] } } } }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                    interactions {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Interaction)
            SET this0.id = randomUUID()
            SET this0.kind = $this0_kind
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Person)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_subjects_connect_Person
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Place)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_subjects_connect_Place
            }
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_objects_connect0_node:Person)
            	WHERE this0_objects_connect0_node.id IN $this0_objects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_objects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_objects_connect_Person
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_objects_connect0_node:Place)
            	WHERE this0_objects_connect0_node.id IN $this0_objects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_objects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_objects_connect_Place
            }
            RETURN this0
            }
            RETURN [
            this0 { .id }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_kind\\": \\"PARENT_OF\\",
                \\"this0_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_objects_connect0_node_param0\\": [
                    \\"abel\\"
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("should produce Cypher which doesn't create duplicate nodes, selecting related nodes", async () => {
        const query = gql`
            mutation {
                createInteractions(
                    input: [
                        {
                            subjects: { connect: { where: { node: { id_IN: ["adam", "eve"] } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id_IN: ["cain"] } } } }
                        }
                        {
                            subjects: { connect: { where: { node: { id_IN: ["adam", "eve"] } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id_IN: ["abel"] } } } }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                    interactions {
                        id
                        subjects {
                            id
                        }
                        objects {
                            id
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Interaction)
            SET this0.id = randomUUID()
            SET this0.kind = $this0_kind
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Person)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_subjects_connect_Person
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Place)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_subjects_connect_Place
            }
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_objects_connect0_node:Person)
            	WHERE this0_objects_connect0_node.id IN $this0_objects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_objects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_objects_connect_Person
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_objects_connect0_node:Place)
            	WHERE this0_objects_connect0_node.id IN $this0_objects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_objects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_objects_connect_Place
            }
            RETURN this0
            }
            CALL {
            CREATE (this1:Interaction)
            SET this1.id = randomUUID()
            SET this1.kind = $this1_kind
            WITH this1
            CALL {
            	WITH this1
            	OPTIONAL MATCH (this1_subjects_connect0_node:Person)
            	WHERE this1_subjects_connect0_node.id IN $this1_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this1 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this1_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this1)<-[:ACTED_IN]-(this1_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this1_subjects_connect_Person
            }
            CALL {
            		WITH this1
            	OPTIONAL MATCH (this1_subjects_connect0_node:Place)
            	WHERE this1_subjects_connect0_node.id IN $this1_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this1 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this1_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this1)<-[:ACTED_IN]-(this1_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this1_subjects_connect_Place
            }
            WITH this1
            CALL {
            	WITH this1
            	OPTIONAL MATCH (this1_objects_connect0_node:Person)
            	WHERE this1_objects_connect0_node.id IN $this1_objects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this1 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this1_objects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this1)-[:ACTED_IN]->(this1_objects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this1_objects_connect_Person
            }
            CALL {
            		WITH this1
            	OPTIONAL MATCH (this1_objects_connect0_node:Place)
            	WHERE this1_objects_connect0_node.id IN $this1_objects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this1 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this1_objects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this1)-[:ACTED_IN]->(this1_objects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this1_objects_connect_Place
            }
            RETURN this1
            }
            WITH *
            CALL {
            WITH this0
            CALL {
                WITH this0
                MATCH (this0)<-[create_this0:ACTED_IN]-(this0_Person:\`Person\`)
                RETURN { __resolveType: \\"Person\\", id: this0_Person.id } AS this0_subjects
                UNION
                WITH this0
                MATCH (this0)<-[create_this1:ACTED_IN]-(this0_Place:\`Place\`)
                RETURN { __resolveType: \\"Place\\", id: this0_Place.id } AS this0_subjects
            }
            RETURN collect(this0_subjects) AS this0_subjects
            }
            WITH *
            CALL {
            WITH this0
            CALL {
                WITH this0
                MATCH (this0)-[create_this2:ACTED_IN]->(this0_Person:\`Person\`)
                RETURN { __resolveType: \\"Person\\", id: this0_Person.id } AS this0_objects
                UNION
                WITH this0
                MATCH (this0)-[create_this3:ACTED_IN]->(this0_Place:\`Place\`)
                RETURN { __resolveType: \\"Place\\", id: this0_Place.id } AS this0_objects
            }
            RETURN collect(this0_objects) AS this0_objects
            }
            WITH *
            CALL {
            WITH this1
            CALL {
                WITH this1
                MATCH (this1)<-[create_this0:ACTED_IN]-(this1_Person:\`Person\`)
                RETURN { __resolveType: \\"Person\\", id: this1_Person.id } AS this1_subjects
                UNION
                WITH this1
                MATCH (this1)<-[create_this1:ACTED_IN]-(this1_Place:\`Place\`)
                RETURN { __resolveType: \\"Place\\", id: this1_Place.id } AS this1_subjects
            }
            RETURN collect(this1_subjects) AS this1_subjects
            }
            WITH *
            CALL {
            WITH this1
            CALL {
                WITH this1
                MATCH (this1)-[create_this2:ACTED_IN]->(this1_Person:\`Person\`)
                RETURN { __resolveType: \\"Person\\", id: this1_Person.id } AS this1_objects
                UNION
                WITH this1
                MATCH (this1)-[create_this3:ACTED_IN]->(this1_Place:\`Place\`)
                RETURN { __resolveType: \\"Place\\", id: this1_Place.id } AS this1_objects
            }
            RETURN collect(this1_objects) AS this1_objects
            }
            RETURN [
            this0 { .id, subjects: this0_subjects, objects: this0_objects },
            this1 { .id, subjects: this1_subjects, objects: this1_objects }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_kind\\": \\"PARENT_OF\\",
                \\"this0_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_objects_connect0_node_param0\\": [
                    \\"cain\\"
                ],
                \\"this1_kind\\": \\"PARENT_OF\\",
                \\"this1_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this1_objects_connect0_node_param0\\": [
                    \\"abel\\"
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("simplest reproduction", async () => {
        const query = gql`
            mutation {
                createInteractions(
                    input: [
                        { subjects: { connect: { where: { node: { id_IN: ["adam", "eve"] } } } }, kind: "PARENT_OF" }
                        { kind: "PARENT_OF" }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                    interactions {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Interaction)
            SET this0.id = randomUUID()
            SET this0.kind = $this0_kind
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Person)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_subjects_connect_Person
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Place)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	FOREACH(_ IN CASE WHEN this0 IS NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE WHEN this0_subjects_connect0_node IS NULL THEN [] ELSE [1] END |
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		)
            	)
            	RETURN count(*) AS connect_this0_subjects_connect_Place
            }
            RETURN this0
            }
            CALL {
            CREATE (this1:Interaction)
            SET this1.id = randomUUID()
            SET this1.kind = $this1_kind
            RETURN this1
            }
            RETURN [
            this0 { .id },
            this1 { .id }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_kind\\": \\"PARENT_OF\\",
                \\"this0_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this1_kind\\": \\"PARENT_OF\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

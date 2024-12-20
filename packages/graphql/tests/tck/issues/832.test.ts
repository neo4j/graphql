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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/832", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Entity {
                id: String!
            }

            type Person implements Entity @node {
                id: String!
                name: String!
            }

            type Place implements Entity @node {
                id: String!
                location: Point!
            }

            type Interaction @node {
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
        const query = /* GraphQL */ `
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
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Person)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect0_node
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		}
            	}
            WITH this0, this0_subjects_connect0_node
            	RETURN count(*) AS connect_this0_subjects_connect_Person0
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_subjects_connect1_node:Place)
            	WHERE this0_subjects_connect1_node.id IN $this0_subjects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect1_node
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect1_node)
            		}
            	}
            WITH this0, this0_subjects_connect1_node
            	RETURN count(*) AS connect_this0_subjects_connect_Place1
            }
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_objects_connect0_node:Person)
            	WHERE this0_objects_connect0_node.id IN $this0_objects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_objects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_objects_connect0_node
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect0_node)
            		}
            	}
            WITH this0, this0_objects_connect0_node
            	RETURN count(*) AS connect_this0_objects_connect_Person0
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_objects_connect1_node:Place)
            	WHERE this0_objects_connect1_node.id IN $this0_objects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_objects_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_objects_connect1_node
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect1_node)
            		}
            	}
            WITH this0, this0_objects_connect1_node
            	RETURN count(*) AS connect_this0_objects_connect_Place1
            }
            RETURN this0
            }
            CALL {
            CREATE (this1:Interaction)
            SET this1.id = randomUUID()
            SET this1.kind = $this1_kind
            WITH *
            CALL {
            	WITH this1
            	OPTIONAL MATCH (this1_subjects_connect0_node:Person)
            	WHERE this1_subjects_connect0_node.id IN $this1_subjects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this1_subjects_connect0_node) as connectedNodes, collect(this1) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this1
            			UNWIND connectedNodes as this1_subjects_connect0_node
            			MERGE (this1)<-[:ACTED_IN]-(this1_subjects_connect0_node)
            		}
            	}
            WITH this1, this1_subjects_connect0_node
            	RETURN count(*) AS connect_this1_subjects_connect_Person0
            }
            CALL {
            		WITH this1
            	OPTIONAL MATCH (this1_subjects_connect1_node:Place)
            	WHERE this1_subjects_connect1_node.id IN $this1_subjects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this1_subjects_connect1_node) as connectedNodes, collect(this1) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this1
            			UNWIND connectedNodes as this1_subjects_connect1_node
            			MERGE (this1)<-[:ACTED_IN]-(this1_subjects_connect1_node)
            		}
            	}
            WITH this1, this1_subjects_connect1_node
            	RETURN count(*) AS connect_this1_subjects_connect_Place1
            }
            WITH *
            CALL {
            	WITH this1
            	OPTIONAL MATCH (this1_objects_connect0_node:Person)
            	WHERE this1_objects_connect0_node.id IN $this1_objects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this1_objects_connect0_node) as connectedNodes, collect(this1) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this1
            			UNWIND connectedNodes as this1_objects_connect0_node
            			MERGE (this1)-[:ACTED_IN]->(this1_objects_connect0_node)
            		}
            	}
            WITH this1, this1_objects_connect0_node
            	RETURN count(*) AS connect_this1_objects_connect_Person0
            }
            CALL {
            		WITH this1
            	OPTIONAL MATCH (this1_objects_connect1_node:Place)
            	WHERE this1_objects_connect1_node.id IN $this1_objects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this1_objects_connect1_node) as connectedNodes, collect(this1) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this1
            			UNWIND connectedNodes as this1_objects_connect1_node
            			MERGE (this1)-[:ACTED_IN]->(this1_objects_connect1_node)
            		}
            	}
            WITH this1, this1_objects_connect1_node
            	RETURN count(*) AS connect_this1_objects_connect_Place1
            }
            RETURN this1
            }
            CALL {
                WITH this0
                RETURN this0 { .id } AS create_var0
            }
            CALL {
                WITH this1
                RETURN this1 { .id } AS create_var1
            }
            RETURN [create_var0, create_var1] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_kind\\": \\"PARENT_OF\\",
                \\"this0_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_subjects_connect1_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_objects_connect0_node_param0\\": [
                    \\"cain\\"
                ],
                \\"this0_objects_connect1_node_param0\\": [
                    \\"cain\\"
                ],
                \\"this1_kind\\": \\"PARENT_OF\\",
                \\"this1_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this1_subjects_connect1_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this1_objects_connect0_node_param0\\": [
                    \\"abel\\"
                ],
                \\"this1_objects_connect1_node_param0\\": [
                    \\"abel\\"
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("should produce Cypher correctly creates one interaction", async () => {
        const query = /* GraphQL */ `
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
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Person)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect0_node
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		}
            	}
            WITH this0, this0_subjects_connect0_node
            	RETURN count(*) AS connect_this0_subjects_connect_Person0
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_subjects_connect1_node:Place)
            	WHERE this0_subjects_connect1_node.id IN $this0_subjects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect1_node
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect1_node)
            		}
            	}
            WITH this0, this0_subjects_connect1_node
            	RETURN count(*) AS connect_this0_subjects_connect_Place1
            }
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_objects_connect0_node:Person)
            	WHERE this0_objects_connect0_node.id IN $this0_objects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_objects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_objects_connect0_node
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect0_node)
            		}
            	}
            WITH this0, this0_objects_connect0_node
            	RETURN count(*) AS connect_this0_objects_connect_Person0
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_objects_connect1_node:Place)
            	WHERE this0_objects_connect1_node.id IN $this0_objects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_objects_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_objects_connect1_node
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect1_node)
            		}
            	}
            WITH this0, this0_objects_connect1_node
            	RETURN count(*) AS connect_this0_objects_connect_Place1
            }
            RETURN this0
            }
            CALL {
                WITH this0
                RETURN this0 { .id } AS create_var0
            }
            RETURN [create_var0] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_kind\\": \\"PARENT_OF\\",
                \\"this0_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_subjects_connect1_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_objects_connect0_node_param0\\": [
                    \\"cain\\"
                ],
                \\"this0_objects_connect1_node_param0\\": [
                    \\"cain\\"
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("should produce Cypher correctly creates second interaction", async () => {
        const query = /* GraphQL */ `
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
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Person)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect0_node
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		}
            	}
            WITH this0, this0_subjects_connect0_node
            	RETURN count(*) AS connect_this0_subjects_connect_Person0
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_subjects_connect1_node:Place)
            	WHERE this0_subjects_connect1_node.id IN $this0_subjects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect1_node
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect1_node)
            		}
            	}
            WITH this0, this0_subjects_connect1_node
            	RETURN count(*) AS connect_this0_subjects_connect_Place1
            }
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_objects_connect0_node:Person)
            	WHERE this0_objects_connect0_node.id IN $this0_objects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_objects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_objects_connect0_node
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect0_node)
            		}
            	}
            WITH this0, this0_objects_connect0_node
            	RETURN count(*) AS connect_this0_objects_connect_Person0
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_objects_connect1_node:Place)
            	WHERE this0_objects_connect1_node.id IN $this0_objects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_objects_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_objects_connect1_node
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect1_node)
            		}
            	}
            WITH this0, this0_objects_connect1_node
            	RETURN count(*) AS connect_this0_objects_connect_Place1
            }
            RETURN this0
            }
            CALL {
                WITH this0
                RETURN this0 { .id } AS create_var0
            }
            RETURN [create_var0] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_kind\\": \\"PARENT_OF\\",
                \\"this0_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_subjects_connect1_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_objects_connect0_node_param0\\": [
                    \\"abel\\"
                ],
                \\"this0_objects_connect1_node_param0\\": [
                    \\"abel\\"
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("should produce Cypher which doesn't create duplicate nodes, selecting related nodes", async () => {
        const query = /* GraphQL */ `
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
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Person)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect0_node
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		}
            	}
            WITH this0, this0_subjects_connect0_node
            	RETURN count(*) AS connect_this0_subjects_connect_Person0
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_subjects_connect1_node:Place)
            	WHERE this0_subjects_connect1_node.id IN $this0_subjects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect1_node
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect1_node)
            		}
            	}
            WITH this0, this0_subjects_connect1_node
            	RETURN count(*) AS connect_this0_subjects_connect_Place1
            }
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_objects_connect0_node:Person)
            	WHERE this0_objects_connect0_node.id IN $this0_objects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_objects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_objects_connect0_node
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect0_node)
            		}
            	}
            WITH this0, this0_objects_connect0_node
            	RETURN count(*) AS connect_this0_objects_connect_Person0
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_objects_connect1_node:Place)
            	WHERE this0_objects_connect1_node.id IN $this0_objects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_objects_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_objects_connect1_node
            			MERGE (this0)-[:ACTED_IN]->(this0_objects_connect1_node)
            		}
            	}
            WITH this0, this0_objects_connect1_node
            	RETURN count(*) AS connect_this0_objects_connect_Place1
            }
            RETURN this0
            }
            CALL {
            CREATE (this1:Interaction)
            SET this1.id = randomUUID()
            SET this1.kind = $this1_kind
            WITH *
            CALL {
            	WITH this1
            	OPTIONAL MATCH (this1_subjects_connect0_node:Person)
            	WHERE this1_subjects_connect0_node.id IN $this1_subjects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this1_subjects_connect0_node) as connectedNodes, collect(this1) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this1
            			UNWIND connectedNodes as this1_subjects_connect0_node
            			MERGE (this1)<-[:ACTED_IN]-(this1_subjects_connect0_node)
            		}
            	}
            WITH this1, this1_subjects_connect0_node
            	RETURN count(*) AS connect_this1_subjects_connect_Person0
            }
            CALL {
            		WITH this1
            	OPTIONAL MATCH (this1_subjects_connect1_node:Place)
            	WHERE this1_subjects_connect1_node.id IN $this1_subjects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this1_subjects_connect1_node) as connectedNodes, collect(this1) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this1
            			UNWIND connectedNodes as this1_subjects_connect1_node
            			MERGE (this1)<-[:ACTED_IN]-(this1_subjects_connect1_node)
            		}
            	}
            WITH this1, this1_subjects_connect1_node
            	RETURN count(*) AS connect_this1_subjects_connect_Place1
            }
            WITH *
            CALL {
            	WITH this1
            	OPTIONAL MATCH (this1_objects_connect0_node:Person)
            	WHERE this1_objects_connect0_node.id IN $this1_objects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this1_objects_connect0_node) as connectedNodes, collect(this1) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this1
            			UNWIND connectedNodes as this1_objects_connect0_node
            			MERGE (this1)-[:ACTED_IN]->(this1_objects_connect0_node)
            		}
            	}
            WITH this1, this1_objects_connect0_node
            	RETURN count(*) AS connect_this1_objects_connect_Person0
            }
            CALL {
            		WITH this1
            	OPTIONAL MATCH (this1_objects_connect1_node:Place)
            	WHERE this1_objects_connect1_node.id IN $this1_objects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this1_objects_connect1_node) as connectedNodes, collect(this1) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this1
            			UNWIND connectedNodes as this1_objects_connect1_node
            			MERGE (this1)-[:ACTED_IN]->(this1_objects_connect1_node)
            		}
            	}
            WITH this1, this1_objects_connect1_node
            	RETURN count(*) AS connect_this1_objects_connect_Place1
            }
            RETURN this1
            }
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)<-[create_this0:ACTED_IN]-(create_this1:Person)
                        WITH create_this1 { .id, __resolveType: \\"Person\\", __id: id(create_this1) } AS create_this1
                        RETURN create_this1 AS create_var2
                        UNION
                        WITH *
                        MATCH (this0)<-[create_this3:ACTED_IN]-(create_this4:Place)
                        WITH create_this4 { .id, __resolveType: \\"Place\\", __id: id(create_this4) } AS create_this4
                        RETURN create_this4 AS create_var2
                    }
                    WITH create_var2
                    RETURN collect(create_var2) AS create_var2
                }
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)-[create_this5:ACTED_IN]->(create_this6:Person)
                        WITH create_this6 { .id, __resolveType: \\"Person\\", __id: id(create_this6) } AS create_this6
                        RETURN create_this6 AS create_var7
                        UNION
                        WITH *
                        MATCH (this0)-[create_this8:ACTED_IN]->(create_this9:Place)
                        WITH create_this9 { .id, __resolveType: \\"Place\\", __id: id(create_this9) } AS create_this9
                        RETURN create_this9 AS create_var7
                    }
                    WITH create_var7
                    RETURN collect(create_var7) AS create_var7
                }
                RETURN this0 { .id, subjects: create_var2, objects: create_var7 } AS create_var10
            }
            CALL {
                WITH this1
                CALL {
                    WITH this1
                    CALL {
                        WITH *
                        MATCH (this1)<-[create_this11:ACTED_IN]-(create_this12:Person)
                        WITH create_this12 { .id, __resolveType: \\"Person\\", __id: id(create_this12) } AS create_this12
                        RETURN create_this12 AS create_var13
                        UNION
                        WITH *
                        MATCH (this1)<-[create_this14:ACTED_IN]-(create_this15:Place)
                        WITH create_this15 { .id, __resolveType: \\"Place\\", __id: id(create_this15) } AS create_this15
                        RETURN create_this15 AS create_var13
                    }
                    WITH create_var13
                    RETURN collect(create_var13) AS create_var13
                }
                CALL {
                    WITH this1
                    CALL {
                        WITH *
                        MATCH (this1)-[create_this16:ACTED_IN]->(create_this17:Person)
                        WITH create_this17 { .id, __resolveType: \\"Person\\", __id: id(create_this17) } AS create_this17
                        RETURN create_this17 AS create_var18
                        UNION
                        WITH *
                        MATCH (this1)-[create_this19:ACTED_IN]->(create_this20:Place)
                        WITH create_this20 { .id, __resolveType: \\"Place\\", __id: id(create_this20) } AS create_this20
                        RETURN create_this20 AS create_var18
                    }
                    WITH create_var18
                    RETURN collect(create_var18) AS create_var18
                }
                RETURN this1 { .id, subjects: create_var13, objects: create_var18 } AS create_var21
            }
            RETURN [create_var10, create_var21] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_kind\\": \\"PARENT_OF\\",
                \\"this0_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_subjects_connect1_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_objects_connect0_node_param0\\": [
                    \\"cain\\"
                ],
                \\"this0_objects_connect1_node_param0\\": [
                    \\"cain\\"
                ],
                \\"this1_kind\\": \\"PARENT_OF\\",
                \\"this1_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this1_subjects_connect1_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this1_objects_connect0_node_param0\\": [
                    \\"abel\\"
                ],
                \\"this1_objects_connect1_node_param0\\": [
                    \\"abel\\"
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("simplest reproduction", async () => {
        const query = /* GraphQL */ `
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
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_subjects_connect0_node:Person)
            	WHERE this0_subjects_connect0_node.id IN $this0_subjects_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect0_node
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect0_node)
            		}
            	}
            WITH this0, this0_subjects_connect0_node
            	RETURN count(*) AS connect_this0_subjects_connect_Person0
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_subjects_connect1_node:Place)
            	WHERE this0_subjects_connect1_node.id IN $this0_subjects_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect1_node
            			MERGE (this0)<-[:ACTED_IN]-(this0_subjects_connect1_node)
            		}
            	}
            WITH this0, this0_subjects_connect1_node
            	RETURN count(*) AS connect_this0_subjects_connect_Place1
            }
            RETURN this0
            }
            CALL {
            CREATE (this1:Interaction)
            SET this1.id = randomUUID()
            SET this1.kind = $this1_kind
            RETURN this1
            }
            CALL {
                WITH this0
                RETURN this0 { .id } AS create_var0
            }
            CALL {
                WITH this1
                RETURN this1 { .id } AS create_var1
            }
            RETURN [create_var0, create_var1] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_kind\\": \\"PARENT_OF\\",
                \\"this0_subjects_connect0_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this0_subjects_connect1_node_param0\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"this1_kind\\": \\"PARENT_OF\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

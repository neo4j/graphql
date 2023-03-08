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
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect0_node
            			MERGE (this0)<-[:\`ACTED_IN\`]-(this0_subjects_connect0_node)
            		}
            	}
            WITH this0, this0_subjects_connect0_node
            	RETURN count(*) AS connect_this0_subjects_connect_Person
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
            			MERGE (this0)<-[:\`ACTED_IN\`]-(this0_subjects_connect1_node)
            		}
            	}
            WITH this0, this0_subjects_connect1_node
            	RETURN count(*) AS connect_this0_subjects_connect_Place
            }
            WITH this0
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
            			MERGE (this0)-[:\`ACTED_IN\`]->(this0_objects_connect0_node)
            		}
            	}
            WITH this0, this0_objects_connect0_node
            	RETURN count(*) AS connect_this0_objects_connect_Person
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
            			MERGE (this0)-[:\`ACTED_IN\`]->(this0_objects_connect1_node)
            		}
            	}
            WITH this0, this0_objects_connect1_node
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
            	CALL {
            		WITH *
            		WITH collect(this1_subjects_connect0_node) as connectedNodes, collect(this1) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this1
            			UNWIND connectedNodes as this1_subjects_connect0_node
            			MERGE (this1)<-[:\`ACTED_IN\`]-(this1_subjects_connect0_node)
            		}
            	}
            WITH this1, this1_subjects_connect0_node
            	RETURN count(*) AS connect_this1_subjects_connect_Person
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
            			MERGE (this1)<-[:\`ACTED_IN\`]-(this1_subjects_connect1_node)
            		}
            	}
            WITH this1, this1_subjects_connect1_node
            	RETURN count(*) AS connect_this1_subjects_connect_Place
            }
            WITH this1
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
            			MERGE (this1)-[:\`ACTED_IN\`]->(this1_objects_connect0_node)
            		}
            	}
            WITH this1, this1_objects_connect0_node
            	RETURN count(*) AS connect_this1_objects_connect_Person
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
            			MERGE (this1)-[:\`ACTED_IN\`]->(this1_objects_connect1_node)
            		}
            	}
            WITH this1, this1_objects_connect1_node
            	RETURN count(*) AS connect_this1_objects_connect_Place
            }
            RETURN this1
            }
            RETURN [ this0 { .id }, this1 { .id } ] AS data"
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
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect0_node
            			MERGE (this0)<-[:\`ACTED_IN\`]-(this0_subjects_connect0_node)
            		}
            	}
            WITH this0, this0_subjects_connect0_node
            	RETURN count(*) AS connect_this0_subjects_connect_Person
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
            			MERGE (this0)<-[:\`ACTED_IN\`]-(this0_subjects_connect1_node)
            		}
            	}
            WITH this0, this0_subjects_connect1_node
            	RETURN count(*) AS connect_this0_subjects_connect_Place
            }
            WITH this0
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
            			MERGE (this0)-[:\`ACTED_IN\`]->(this0_objects_connect0_node)
            		}
            	}
            WITH this0, this0_objects_connect0_node
            	RETURN count(*) AS connect_this0_objects_connect_Person
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
            			MERGE (this0)-[:\`ACTED_IN\`]->(this0_objects_connect1_node)
            		}
            	}
            WITH this0, this0_objects_connect1_node
            	RETURN count(*) AS connect_this0_objects_connect_Place
            }
            RETURN this0
            }
            RETURN [ this0 { .id } ] AS data"
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
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect0_node
            			MERGE (this0)<-[:\`ACTED_IN\`]-(this0_subjects_connect0_node)
            		}
            	}
            WITH this0, this0_subjects_connect0_node
            	RETURN count(*) AS connect_this0_subjects_connect_Person
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
            			MERGE (this0)<-[:\`ACTED_IN\`]-(this0_subjects_connect1_node)
            		}
            	}
            WITH this0, this0_subjects_connect1_node
            	RETURN count(*) AS connect_this0_subjects_connect_Place
            }
            WITH this0
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
            			MERGE (this0)-[:\`ACTED_IN\`]->(this0_objects_connect0_node)
            		}
            	}
            WITH this0, this0_objects_connect0_node
            	RETURN count(*) AS connect_this0_objects_connect_Person
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
            			MERGE (this0)-[:\`ACTED_IN\`]->(this0_objects_connect1_node)
            		}
            	}
            WITH this0, this0_objects_connect1_node
            	RETURN count(*) AS connect_this0_objects_connect_Place
            }
            RETURN this0
            }
            RETURN [ this0 { .id } ] AS data"
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
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect0_node
            			MERGE (this0)<-[:\`ACTED_IN\`]-(this0_subjects_connect0_node)
            		}
            	}
            WITH this0, this0_subjects_connect0_node
            	RETURN count(*) AS connect_this0_subjects_connect_Person
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
            			MERGE (this0)<-[:\`ACTED_IN\`]-(this0_subjects_connect1_node)
            		}
            	}
            WITH this0, this0_subjects_connect1_node
            	RETURN count(*) AS connect_this0_subjects_connect_Place
            }
            WITH this0
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
            			MERGE (this0)-[:\`ACTED_IN\`]->(this0_objects_connect0_node)
            		}
            	}
            WITH this0, this0_objects_connect0_node
            	RETURN count(*) AS connect_this0_objects_connect_Person
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
            			MERGE (this0)-[:\`ACTED_IN\`]->(this0_objects_connect1_node)
            		}
            	}
            WITH this0, this0_objects_connect1_node
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
            	CALL {
            		WITH *
            		WITH collect(this1_subjects_connect0_node) as connectedNodes, collect(this1) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this1
            			UNWIND connectedNodes as this1_subjects_connect0_node
            			MERGE (this1)<-[:\`ACTED_IN\`]-(this1_subjects_connect0_node)
            		}
            	}
            WITH this1, this1_subjects_connect0_node
            	RETURN count(*) AS connect_this1_subjects_connect_Person
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
            			MERGE (this1)<-[:\`ACTED_IN\`]-(this1_subjects_connect1_node)
            		}
            	}
            WITH this1, this1_subjects_connect1_node
            	RETURN count(*) AS connect_this1_subjects_connect_Place
            }
            WITH this1
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
            			MERGE (this1)-[:\`ACTED_IN\`]->(this1_objects_connect0_node)
            		}
            	}
            WITH this1, this1_objects_connect0_node
            	RETURN count(*) AS connect_this1_objects_connect_Person
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
            			MERGE (this1)-[:\`ACTED_IN\`]->(this1_objects_connect1_node)
            		}
            	}
            WITH this1, this1_objects_connect1_node
            	RETURN count(*) AS connect_this1_objects_connect_Place
            }
            RETURN this1
            }
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)<-[create_this0:\`ACTED_IN\`]-(create_this1:\`Person\`)
                    WITH create_this1 { __resolveType: \\"Person\\", __id: id(this0), .id } AS create_this1
                    RETURN create_this1 AS create_var2
                    UNION
                    WITH *
                    MATCH (this0)<-[create_this3:\`ACTED_IN\`]-(create_this4:\`Place\`)
                    WITH create_this4 { __resolveType: \\"Place\\", __id: id(this0), .id } AS create_this4
                    RETURN create_this4 AS create_var2
                }
                WITH create_var2
                RETURN collect(create_var2) AS create_var2
            }
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)-[create_this5:\`ACTED_IN\`]->(create_this6:\`Person\`)
                    WITH create_this6 { __resolveType: \\"Person\\", __id: id(this0), .id } AS create_this6
                    RETURN create_this6 AS create_var7
                    UNION
                    WITH *
                    MATCH (this0)-[create_this8:\`ACTED_IN\`]->(create_this9:\`Place\`)
                    WITH create_this9 { __resolveType: \\"Place\\", __id: id(this0), .id } AS create_this9
                    RETURN create_this9 AS create_var7
                }
                WITH create_var7
                RETURN collect(create_var7) AS create_var7
            }
            CALL {
                WITH this1
                CALL {
                    WITH *
                    MATCH (this1)<-[create_this10:\`ACTED_IN\`]-(create_this11:\`Person\`)
                    WITH create_this11 { __resolveType: \\"Person\\", __id: id(this1), .id } AS create_this11
                    RETURN create_this11 AS create_var12
                    UNION
                    WITH *
                    MATCH (this1)<-[create_this13:\`ACTED_IN\`]-(create_this14:\`Place\`)
                    WITH create_this14 { __resolveType: \\"Place\\", __id: id(this1), .id } AS create_this14
                    RETURN create_this14 AS create_var12
                }
                WITH create_var12
                RETURN collect(create_var12) AS create_var12
            }
            CALL {
                WITH this1
                CALL {
                    WITH *
                    MATCH (this1)-[create_this15:\`ACTED_IN\`]->(create_this16:\`Person\`)
                    WITH create_this16 { __resolveType: \\"Person\\", __id: id(this1), .id } AS create_this16
                    RETURN create_this16 AS create_var17
                    UNION
                    WITH *
                    MATCH (this1)-[create_this18:\`ACTED_IN\`]->(create_this19:\`Place\`)
                    WITH create_this19 { __resolveType: \\"Place\\", __id: id(this1), .id } AS create_this19
                    RETURN create_this19 AS create_var17
                }
                WITH create_var17
                RETURN collect(create_var17) AS create_var17
            }
            RETURN [ this0 { .id, subjects: create_var2, objects: create_var7 }, this1 { .id, subjects: create_var12, objects: create_var17 } ] AS data"
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
            	CALL {
            		WITH *
            		WITH collect(this0_subjects_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_subjects_connect0_node
            			MERGE (this0)<-[:\`ACTED_IN\`]-(this0_subjects_connect0_node)
            		}
            	}
            WITH this0, this0_subjects_connect0_node
            	RETURN count(*) AS connect_this0_subjects_connect_Person
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
            			MERGE (this0)<-[:\`ACTED_IN\`]-(this0_subjects_connect1_node)
            		}
            	}
            WITH this0, this0_subjects_connect1_node
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
            RETURN [ this0 { .id }, this1 { .id } ] AS data"
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

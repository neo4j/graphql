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

describe("https://github.com/neo4j/graphql/issues/6298", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Pear {
                name: String!
                apples: [Apple!]! @relationship(type: "HAS_APPLE", direction: OUT)
            }

            type Apple {
                # filter on apple.banana.price
                banana: Banana! @relationship(type: "HAS_BANANA", direction: OUT)

                # filter on apple.grape.carrot.potato.number
                grape: Grape! @relationship(type: "HAS_GRAPE", direction: OUT)
            }

            type Banana {
                price: String!
            }

            type Grape {
                carrot: Carrot @relationship(type: "HAS_CARROT", direction: OUT)

                potatoShortCut: Potato!
                    @relationship(
                        # (this)-[:HAS_CARROT]->(:Carrot)-[:HAS_POTATO]->(target:Potato)
                        type: "HAS_CARROT]->(:Carrot)-[:HAS_POTATO"
                        direction: OUT
                    )
            }

            type Carrot {
                name: String! @unique

                potato: Potato! @relationship(type: "HAS_POTATO", direction: OUT)
            }

            type Potato {
                number: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                unsafeEscapeOptions: {
                    disableRelationshipTypeEscaping: true,
                    disableNodeLabelEscaping: false,
                },
            },
        });
    });

    test("should not escape relationship variables", async () => {
        const query = /* GraphQL */ `
            mutation CreateGrapes {
                createGrapes(input: [{ carrot: { connect: { where: { node: { name: "carrot1" } } } } }]) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const { cypher, params } = await translateQuery(neoSchema, query);

        expect(formatCypher(cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Grape)
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_carrot_connect0_node:Carrot)
            	WHERE this0_carrot_connect0_node.name = $this0_carrot_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_carrot_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_carrot_connect0_node
            			MERGE (this0)-[:HAS_CARROT]->(this0_carrot_connect0_node)
            		}
            	}
            WITH this0, this0_carrot_connect0_node
            	RETURN count(*) AS connect_this0_carrot_connect_Carrot0
            }
            WITH *
            CALL {
            	WITH this0
            	MATCH (this0)-[this0_carrot_Carrot_unique:HAS_CARROT]->(:Carrot)
            	WITH count(this0_carrot_Carrot_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDGrape.carrot must be less than or equal to one', [0])
            	RETURN c AS this0_carrot_Carrot_unique_ignored
            }
            CALL {
            	WITH this0
            	MATCH (this0)-[this0_potatoShortCut_Potato_unique:HAS_CARROT]->(:Carrot)-[:HAS_POTATO]->(:Potato)
            	WITH count(this0_potatoShortCut_Potato_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDGrape.potatoShortCut required exactly once', [0])
            	RETURN c AS this0_potatoShortCut_Potato_unique_ignored
            }
            RETURN this0
            }
            RETURN \\"Query cannot conclude with CALL\\""
        `);
        expect(formatParams(params)).toMatchInlineSnapshot(`
            "{
                \\"this0_carrot_connect0_node_param0\\": \\"carrot1\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

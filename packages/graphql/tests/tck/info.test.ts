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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../src";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";

describe("info", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String!
            }

            type Movie {
                id: ID
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should return info from a create mutation", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ title: "title", actors: { create: [{ node: { name: "Keanu" } }] } }]) {
                    info {
                        bookmark
                        nodesCreated
                        relationshipsCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.title = create_var0.title
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    WITH create_var2.node AS create_var3, create_var2.edge AS create_var4, create_this1
                    CREATE (create_this5:Actor)
                    SET
                        create_this5.name = create_var3.name
                    MERGE (create_this1)<-[create_this6:ACTED_IN]-(create_this5)
                    RETURN collect(NULL) AS create_var7
                }
                RETURN create_this1
            }
            RETURN \\"Query cannot conclude with CALL\\""
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"title\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"name\\": \\"Keanu\\"
                                    }
                                }
                            ]
                        }
                    }
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("should return info from a delete mutation", async () => {
        const query = gql`
            mutation {
                deleteMovies(where: { id: "123" }) {
                    bookmark
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $param0
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\"
            }"
        `);
    });

    test("should return info from an update mutation", async () => {
        const query = gql`
            mutation {
                updateMovies(where: { id: "123" }) {
                    info {
                        bookmark
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $param0
            RETURN 'Query cannot conclude with CALL'"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
describe.only("info (unwind disabled by subscription)", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String!
            }

            type Movie {
                id: ID
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: true,
            },
        });
    });

    test("should return info from a create mutation", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ title: "title", actors: { create: [{ node: { name: "Keanu" } }] } }]) {
                    info {
                        bookmark
                        nodesCreated
                        relationshipsCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Movie)
            SET this0.title = $this0_title
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.name = $this0_actors0_node_name
            WITH *, meta + { event: \\"create\\", id: id(this0_actors0_node), properties: { old: null, new: this0_actors0_node { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta
            MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)
            WITH meta + { event: \\"create_relationship\\", timestamp: timestamp(), id_from: id(this0_actors0_node), id_to: id(this0), id: id(this0_actors0_relationship), relationshipName: \\"ACTED_IN\\", fromTypename: \\"Actor\\", toTypename: \\"Movie\\", properties: { from: this0_actors0_node { .* }, to: this0 { .* }, relationship: this0_actors0_relationship { .* } } } AS meta, this0, this0_actors0_node
            WITH *, meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            RETURN this0, meta AS this0_meta
            }
            WITH this0, this0_meta AS meta
            RETURN meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"title\\",
                \\"this0_actors0_node_name\\": \\"Keanu\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("should return info from a delete mutation", async () => {
        const query = gql`
            mutation {
                deleteMovies(where: { id: "123" }) {
                    bookmark
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "WITH [] AS meta
            MATCH (this:Movie)
            WHERE this.id = $param0
            WITH this, meta + { event: \\"delete\\", id: id(this), properties: { old: this { .* }, new: null }, timestamp: timestamp(), typename: \\"Movie\\" } AS meta
            CALL {
            	WITH this
            	OPTIONAL MATCH (this)-[r]-()
            	WITH this, collect(DISTINCT r) AS relationships_to_delete
            	UNWIND relationships_to_delete AS x
            	WITH CASE
            		WHEN id(this)=id(startNode(x)) THEN { event: \\"delete_relationship\\", timestamp: timestamp(), id_from: id(this), id_to: id(endNode(x)), id: id(x), relationshipName: type(x), fromLabels: labels(this), toLabels: labels(endNode(x)), properties: { from: properties(this), to: properties(endNode(x)), relationship: x { .* } } }
            		WHEN id(this)=id(endNode(x)) THEN { event: \\"delete_relationship\\", timestamp: timestamp(), id_from: id(startNode(x)), id_to: id(this), id: id(x), relationshipName: type(x), fromLabels: labels(startNode(x)), toLabels: labels(this), properties: { from: properties(startNode(x)), to: properties(this), relationship: x { .* } } }
            	END AS meta
            	RETURN collect(DISTINCT meta) AS relationship_meta
            }
            WITH REDUCE(m=meta, r IN relationship_meta | m + r) AS meta, this
            DETACH DELETE this
            WITH collect(meta) AS meta
            WITH REDUCE(m=[], n IN meta | m + n) AS meta
            RETURN meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\"
            }"
        `);
    });

    test("should return info from an update mutation", async () => {
        const query = gql`
            mutation {
                updateMovies(where: { id: "123" }) {
                    info {
                        bookmark
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "WITH [] AS meta
            MATCH (this:Movie)
            WHERE this.id = $param0
            WITH *
            UNWIND (CASE meta WHEN [] then [null] else meta end) AS m
            RETURN
            collect(DISTINCT m) as meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

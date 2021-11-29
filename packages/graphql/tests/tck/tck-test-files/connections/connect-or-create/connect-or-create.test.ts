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

describe("Create or connect", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String! @unique
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                screentime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Create with createOrConnect operation", async () => {
        const query = gql`
            mutation {
                createActors(
                    input: [
                        {
                            name: "Tom Hanks"
                            movies: {
                                connectOrCreate: {
                                    where: { node: { title: "The Terminal" } }
                                    onCreate: { edge: { screentime: 105 }, node: { title: "The Terminal" } }
                                }
                            }
                        }
                    ]
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
            "CALL {
            CREATE (this0:Actor)
            SET this0.name = $this0_name
            MERGE (this0_movies_connectOrCreate0:Movie { title: $this0_movies_connectOrCreate0_node_title })
            ON CREATE
            SET
            this0_movies_connectOrCreate0.title = $this0_movies_connectOrCreate0_on_create_title
            MERGE (this0)-[this0_relationship_this0_movies_connectOrCreate0:ACTED_IN]->(this0_movies_connectOrCreate0)
            ON CREATE
            SET
            this0_relationship_this0_movies_connectOrCreate0.screentime = $this0_relationship_this0_movies_connectOrCreate0_on_create_screentime
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT([ metaVal IN [{type: 'Created', name: 'Actor', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ]) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .name } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"Tom Hanks\\",
                \\"this0_movies_connectOrCreate0_node_title\\": \\"The Terminal\\",
                \\"this0_movies_connectOrCreate0_on_create_title\\": \\"The Terminal\\",
                \\"this0_relationship_this0_movies_connectOrCreate0_on_create_screentime\\": {
                    \\"low\\": 105,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Update with createOrConnect operation", async () => {
        const query = gql`
            mutation {
                updateActors(
                    update: {
                        name: "Tom Hanks 2"
                        movies: {
                            connectOrCreate: {
                                where: { node: { title: "The Terminal" } }
                                onCreate: { edge: { screentime: 105 }, node: { title: "The Terminal" } }
                            }
                        }
                    }
                    where: { name: "Tom Hanks" }
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
            WHERE this.name = $this_name
            SET this.name = $this_update_name
            WITH this
            WITH this
            CALL {
            	WITH this
            	MERGE (this_movies0_connectOrCreate0:Movie { title: $this_movies0_connectOrCreate0_node_title })
            ON CREATE
            SET
            this_movies0_connectOrCreate0.title = $this_movies0_connectOrCreate0_on_create_title
            MERGE (this)-[this_relationship_this_movies0_connectOrCreate0:ACTED_IN]->(this_movies0_connectOrCreate0)
            ON CREATE
            SET
            this_relationship_this_movies0_connectOrCreate0.screentime = $this_relationship_this_movies0_connectOrCreate0_on_create_screentime
            	RETURN COUNT(*)
            }
            WITH this, [ metaVal IN [{type: 'Updated', name: 'Actor', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(EXISTS((this)-[:ACTED_IN]->(:Movie))), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.movies required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN mutateMeta, this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_name\\": \\"Tom Hanks\\",
                \\"this_update_name\\": \\"Tom Hanks 2\\",
                \\"this_movies0_connectOrCreate0_node_title\\": \\"The Terminal\\",
                \\"this_movies0_connectOrCreate0_on_create_title\\": \\"The Terminal\\",
                \\"this_relationship_this_movies0_connectOrCreate0_on_create_screentime\\": {
                    \\"low\\": 105,
                    \\"high\\": 0
                },
                \\"this_update\\": {
                    \\"name\\": \\"Tom Hanks 2\\"
                }
            }"
        `);
    });
});

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
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("integration/rfs/003", () => {
    const typeDefs = gql`
        type Director {
            id: ID!
        }

        type Movie {
            id: ID!
            director: Director! @relationship(type: "DIRECTED", direction: IN)
        }
    `;

    const neoSchema = new Neo4jGraphQL({
        typeDefs,
    });

    describe("on-to-one", () => {
        test("should add cypher validation when creating a node without a (single) relationship", async () => {
            const movieId = "some-id";

            const mutation = gql`
                mutation {
                    createMovies(input: [{id: "${movieId}"}]) {
                        info {
                            nodesCreated
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});

            const result = await translateQuery(neoSchema, mutation, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.id = $this0_id
                WITH this0
                CALL {
                	WITH this0
                	MATCH p=(this0)<-[:DIRECTED]-(:Director)
                	WITH count(nodes(p)) AS c
                	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                	RETURN c AS this0_director_Director_unique_ignored
                }
                RETURN this0
                }
                RETURN 'Query cannot conclude with CALL'"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_id\\": \\"some-id\\"
                }"
            `);
        });

        test("should add cypher validation when updating a node (top level) without a (single) relationship", async () => {
            const movieId = "some-id";

            const mutation = gql`
                mutation {
                    updateMovies(where: {id: "${movieId}"}, update: { id: "${movieId}" }) {
                        info {
                            nodesCreated
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});

            const result = await translateQuery(neoSchema, mutation, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WHERE this.id = $this_id
                SET this.id = $this_update_id
                WITH this
                CALL {
                	WITH this
                	MATCH p=(this)<-[:DIRECTED]-(:Director)
                	WITH count(nodes(p)) AS c
                	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                	RETURN c AS this_director_Director_unique_ignored
                }
                RETURN 'Query cannot conclude with CALL'"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_id\\": \\"some-id\\",
                    \\"this_update_id\\": \\"some-id\\"
                }"
            `);
        });

        test("should add cypher validation when deleting a non null (single) relationship", async () => {
            const movieId = "some-id";
            const directorId = "some-id";

            const mutation = gql`
                mutation {
                    updateMovies(where: {id: "${movieId}"}, delete: { director: { where: { node: {  id: "${directorId}" } } } }) {
                        info {
                            nodesCreated
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});

            const result = await translateQuery(neoSchema, mutation, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WHERE this.id = $this_id
                WITH this
                OPTIONAL MATCH (this)<-[this_delete_director0_relationship:DIRECTED]-(this_delete_director0:Director)
                WHERE this_delete_director0.id = $updateMovies.args.delete.director.where.node.id
                WITH this, collect(DISTINCT this_delete_director0) as this_delete_director0_to_delete
                FOREACH(x IN this_delete_director0_to_delete | DETACH DELETE x)
                WITH this
                CALL {
                	WITH this
                	MATCH p=(this)<-[:DIRECTED]-(:Director)
                	WITH count(nodes(p)) AS c
                	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.director required', [0])
                	RETURN c AS this_director_Director_unique_ignored
                }
                RETURN 'Query cannot conclude with CALL'"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_id\\": \\"some-id\\",
                    \\"updateMovies\\": {
                        \\"args\\": {
                            \\"delete\\": {
                                \\"director\\": {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"id\\": \\"some-id\\"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }"
            `);
        });
    });
});

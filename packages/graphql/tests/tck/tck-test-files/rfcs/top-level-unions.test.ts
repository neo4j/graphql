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

describe("integration/rfs/top-level-unions", () => {
    test("should query simple top level unions", async () => {
        const typeDefs = gql`
            type Movie {
                id: ID!
            }

            type Series {
                id: ID!
            }

            union Production = Movie | Series
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = gql`
            query {
                productions {
                    ... on Movie {
                        __typename
                        id
                    }
                    ... on Series {
                        __typename
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            req: createJwtRequest("secret", {}),
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CALL {
            MATCH (this_Movie1:Movie)
            RETURN this_Movie1 { __resolveType: \\"Movie\\", .id } as this_Movie1
            }
            RETURN collect(this_Movie1) AS Movie
            }
            CALL {
            CALL {
            MATCH (this_Series2:Series)
            RETURN this_Series2 { __resolveType: \\"Series\\", .id } as this_Series2
            }
            RETURN collect(this_Series2) AS Series
            }
            RETURN Movie, Series"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("should query nested top level unions", async () => {
        const typeDefs = gql`
            type Movie {
                id: ID!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Series {
                id: ID!
                episodes: [Episode!]! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            type Actor {
                id: ID!
            }

            type Episode {
                id: ID!
            }

            union Production = Movie | Series
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = gql`
            query {
                productions {
                    ... on Movie {
                        __typename
                        id
                        actors {
                            id
                        }
                    }
                    ... on Series {
                        __typename
                        id
                        episodes {
                            id
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            req: createJwtRequest("secret", {}),
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CALL {
            MATCH (this_Movie1:Movie)
            RETURN this_Movie1 { __resolveType: \\"Movie\\", .id, actors: [ (this_Movie1)<-[:ACTED_IN]-(this_Movie1_actors:Actor)   | this_Movie1_actors { .id } ] } as this_Movie1
            }
            RETURN collect(this_Movie1) AS Movie
            }
            CALL {
            CALL {
            MATCH (this_Series2:Series)
            RETURN this_Series2 { __resolveType: \\"Series\\", .id, episodes: [ (this_Series2)<-[:HAS_EPISODE]-(this_Series2_episodes:Episode)   | this_Series2_episodes { .id } ] } as this_Series2
            }
            RETURN collect(this_Series2) AS Series
            }
            RETURN Movie, Series"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("should query simple top level unions with where", async () => {
        const typeDefs = gql`
            type Movie {
                id: ID!
            }

            type Series {
                id: ID!
            }

            union Production = Movie | Series
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = "123";
        const seriesId = "321";

        const query = gql`
            query {
                productions(where: { Movie: { id: "${movieId}" }, Series: { id: "${seriesId}" } }) {
                    ... on Movie {
                        __typename
                        id
                    }
                    ... on Series {
                        __typename
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            req: createJwtRequest("secret", {}),
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CALL {
            MATCH (this_Movie1:Movie)
            WHERE this_Movie1.id = $this_Movie1_id
            RETURN this_Movie1 { __resolveType: \\"Movie\\", .id } as this_Movie1
            }
            RETURN collect(this_Movie1) AS Movie
            }
            CALL {
            CALL {
            MATCH (this_Series2:Series)
            WHERE this_Series2.id = $this_Series2_id
            RETURN this_Series2 { __resolveType: \\"Series\\", .id } as this_Series2
            }
            RETURN collect(this_Series2) AS Series
            }
            RETURN Movie, Series"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_Movie1_id\\": \\"123\\",
                \\"this_Series2_id\\": \\"321\\"
            }"
        `);
    });
});

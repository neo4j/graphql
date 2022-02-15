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
import {
    formatCypher,
    translateQuery,
    formatParams,
    setTestEnvVars,
    unsetTestEnvVars,
} from "../../utils/tck-test-utils";

describe("Cypher coalesce()", () => {
    const secret = "secret";

    beforeAll(() => {
        setTestEnvVars("NEO4J_GRAPHQL_ENABLE_REGEX=1");
    });

    afterAll(() => {
        unsetTestEnvVars(undefined);
    });
    test("Simple coalesce", async () => {
        const typeDefs = gql`
            interface UserInterface {
                fromInterface: String! @coalesce(value: "From Interface")
                toBeOverridden: String! @coalesce(value: "To Be Overridden")
            }

            type User implements UserInterface {
                id: ID! @coalesce(value: "00000000-00000000-00000000-00000000")
                name: String! @coalesce(value: "Jane Smith")
                verified: Boolean! @coalesce(value: false)
                numberOfFriends: Int! @coalesce(value: 0)
                rating: Float! @coalesce(value: 2.5)
                fromInterface: String!
                toBeOverridden: String! @coalesce(value: "Overridden")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });

        const query = gql`
            query (
                $id: ID
                $name: String
                $verified: Boolean
                $numberOfFriends: Int
                $rating: Float
                $fromInterface: String
                $toBeOverridden: String
            ) {
                users(
                    where: {
                        id: $id
                        name_MATCHES: $name
                        verified_NOT: $verified
                        numberOfFriends_GT: $numberOfFriends
                        rating_LT: $rating
                        fromInterface: $fromInterface
                        toBeOverridden: $toBeOverridden
                    }
                ) {
                    name
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: {
                id: "Some ID",
                name: "Some name",
                verified: true,
                numberOfFriends: 10,
                rating: 3.5,
                fromInterface: "Some string",
                toBeOverridden: "Some string",
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE coalesce(this.id, \\"00000000-00000000-00000000-00000000\\") = $this_id AND coalesce(this.name, \\"Jane Smith\\") =~ $this_name_MATCHES AND (NOT coalesce(this.verified, false) = $this_verified_NOT) AND coalesce(this.numberOfFriends, 0) > $this_numberOfFriends_GT AND coalesce(this.rating, 2.5) < $this_rating_LT AND coalesce(this.fromInterface, \\"From Interface\\") = $this_fromInterface AND coalesce(this.toBeOverridden, \\"Overridden\\") = $this_toBeOverridden
            RETURN this { .name } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"Some ID\\",
                \\"this_name_MATCHES\\": \\"Some name\\",
                \\"this_verified_NOT\\": true,
                \\"this_numberOfFriends_GT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"this_rating_LT\\": 3.5,
                \\"this_fromInterface\\": \\"Some string\\",
                \\"this_toBeOverridden\\": \\"Some string\\"
            }"
        `);
    });

    test("Coalesce with enum in match", async () => {
        const typeDefs = gql`
            enum Status {
                ACTIVE
                INACTIVE
            }
            type Movie {
                id: ID
                status: Status @coalesce(value: ACTIVE)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });

        const query = gql`
            query {
                movies(where: { status: ACTIVE }) {
                    id
                    status
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
"MATCH (this:Movie)
WHERE coalesce(this.status, \\"ACTIVE\\") = $this_status
RETURN this { .id, .status } as this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
"{
    \\"this_status\\": \\"ACTIVE\\"
}"
`);
    });

    test("Coalesce with enum in projection", async () => {
        const typeDefs = gql`
            enum Status {
                ACTIVE
                INACTIVE
            }
            type Movie {
                id: ID
                status: Status @coalesce(value: ACTIVE)
            }

            type Actor {
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });

        const query = gql`
            query Actors {
                actors {
                    moviesConnection(where: { node: { status: ACTIVE } }) {
                        edges {
                            node {
                                id
                                status
                            }
                        }
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
CALL {
WITH this
MATCH (this)-[this_acted_in_relationship:ACTED_IN]->(this_movie:Movie)
WHERE coalesce(this_movie.status, \\"ACTIVE\\") = $this_moviesConnection.args.where.node.status
WITH collect({ node: { id: this_movie.id, status: this_movie.status } }) AS edges
RETURN { edges: edges, totalCount: size(edges) } AS moviesConnection
}
RETURN this { moviesConnection } as this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
"{
    \\"this_moviesConnection\\": {
        \\"args\\": {
            \\"where\\": {
                \\"node\\": {
                    \\"status\\": \\"ACTIVE\\"
                }
            }
        }
    }
}"
`);
    });
});

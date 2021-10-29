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
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../../src/utils/test/utils";
import {
    formatCypher,
    translateQuery,
    formatParams,
    setTestEnvVars,
    unsetTestEnvVars,
} from "../../utils/tck-test-utils";

describe("Cypher coalesce()", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
        setTestEnvVars("NEO4J_GRAPHQL_ENABLE_REGEX=1");
    });

    afterAll(() => {
        unsetTestEnvVars(undefined);
    });
    test("Simple coalesce", async () => {
        const query = gql`
            query(
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
            RETURN this { .name } AS this"
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
});

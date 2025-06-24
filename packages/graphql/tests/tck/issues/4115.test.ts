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
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4115", () => {
    const secret = "sssh!";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                id: ID!
                roles: [String!]!
            }

            type Family @node {
                id: ID! @id
                members: [Person!]! @relationship(type: "MEMBER_OF", direction: IN)
                creator: [User!]! @relationship(type: "CREATOR_OF", direction: IN)
            }

            type Person
                @node
                @authorization(
                    filter: [
                        {
                            where: {
                                AND: [
                                    { node: { creator: { some: { id: { eq: "$jwt.uid" } } } } }
                                    {
                                        node: {
                                            family: {
                                                some: { creator: { some: { roles: { includes: "plan:paid" } } } }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                id: ID! @id
                creator: [User!]! @relationship(type: "CREATOR_OF", direction: IN, nestedOperations: [CONNECT])
                family: [Family!]! @relationship(type: "MEMBER_OF", direction: OUT)
            }

            type JWT @jwt {
                roles: [String!]!
            }

            extend schema @authentication
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("should generate valid cypher on nested aggregation with combined rules", async () => {
        const query = /* GraphQL */ `
            query Family {
                families {
                    id
                    membersConnection {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                }
            }
        `;
        const token = createBearerToken(secret, { sub: "michel", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Family)
            CALL (this) {
                CALL (this) {
                    MATCH (this)<-[this0:MEMBER_OF]-(this1:Person)
                    WHERE ($isAuthenticated = true AND (EXISTS {
                        MATCH (this1)<-[:CREATOR_OF]-(this2:User)
                        WHERE ($jwt.uid IS NOT NULL AND this2.id = $jwt.uid)
                    } AND EXISTS {
                        MATCH (this1)-[:MEMBER_OF]->(this3:Family)
                        WHERE EXISTS {
                            MATCH (this3)<-[:CREATOR_OF]-(this4:User)
                            WHERE ($param2 IS NOT NULL AND $param2 IN this4.roles)
                        }
                    }))
                    RETURN { nodes: count(DISTINCT this1) } AS var5
                }
                RETURN { aggregate: { count: var5 } } AS var6
            }
            RETURN this { .id, membersConnection: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"michel\\"
                },
                \\"param2\\": \\"plan:paid\\"
            }"
        `);
    });
});

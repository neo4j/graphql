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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("Interface filtering on authorization rules", () => {
    let baseTypes: string;
    let neoSchema: Neo4jGraphQL;
    const secret = "secret";

    beforeAll(() => {
        baseTypes = `
            type JWT @jwt {
                roles: [String]
                groups: [String]
            }

            interface Show {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Show {
                title: String!
                cost: Float
                runtime: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Show {
                title: String!
                episodes: Int
                actors: [Actor!]! @relationship(type: "STARRED_IN", direction: IN, properties: "StarredIn")
            }

            type Actor {
                name: String!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }

            type StarredIn @relationshipProperties {
                episodes: Int
            }
        `;
    });

    test("Logical operator filter (top level)", async () => {
        const typeDefsStr =
            baseTypes +
            /* GraphQL */ `
                extend type Movie
                    @authorization(
                        validate: [
                            {
                                when: [BEFORE]
                                operations: [READ]
                                where: {
                                    node: { OR: [{ title: "The Office" }, { title: "The Office 2" }] }
                                    jwt: { roles_INCLUDES: "admin" }
                                }
                            }
                        ]
                    )
            `;
        const typeDefs = gql(typeDefsStr);
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
        const query = gql`
            query actedInWhere {
                shows {
                    title
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($param1 IS NOT NULL AND this0.title = $param1) OR ($param2 IS NOT NULL AND this0.title = $param2)) AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:Series)
                WITH this1 { .title, __resolveType: \\"Series\\", __id: id(this1) } AS this1
                RETURN this1 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"param1\\": \\"The Office\\",
                \\"param2\\": \\"The Office 2\\",
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param4\\": \\"admin\\"
            }"
        `);
    });

    test("Logical operator filter (nested field)", async () => {
        const typeDefsStr =
            baseTypes +
            /* GraphQL */ `
                extend type Movie
                    @authorization(
                        validate: [
                            {
                                when: [BEFORE]
                                operations: [READ]
                                where: {
                                    node: { OR: [{ title: "The Office" }, { title: "The Office 2" }] }
                                    jwt: { roles_INCLUDES: "admin" }
                                }
                            }
                        ]
                    )
            `;
        const typeDefs = gql(typeDefsStr);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
        const query = gql`
            query actedInWhere {
                actors {
                    actedIn {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($param1 IS NOT NULL AND this1.title = $param1) OR ($param2 IS NOT NULL AND this1.title = $param2)) AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this1 { .title, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    WITH this4 { .title, __resolveType: \\"Series\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"param1\\": \\"The Office\\",
                \\"param2\\": \\"The Office 2\\",
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param4\\": \\"admin\\"
            }"
        `);
    });

    test("Connection operator filter", async () => {
        const typeDefsStr =
            baseTypes +
            /* GraphQL */ `
                extend type Actor
                    @authorization(
                        validate: [
                            {
                                when: [BEFORE]
                                operations: [READ]
                                where: {
                                    node: { actedInConnection_SOME: { node: { title: "The Matrix" } } }
                                    jwt: { roles_INCLUDES: "admin" }
                                }
                            }
                        ]
                    )
            `;
        const typeDefs = gql(typeDefsStr);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
        const query = gql`
            {
                actors {
                    name
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this)-[this1:ACTED_IN]->(this0) WHERE (($param1 IS NOT NULL AND this0.title = $param1) AND (this0:Movie OR this0:Series)) | 1]) > 0 AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"param1\\": \\"The Matrix\\",
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param3\\": \\"admin\\"
            }"
        `);
    });
});

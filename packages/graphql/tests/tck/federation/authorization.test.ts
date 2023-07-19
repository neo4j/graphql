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
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";
import { createBearerToken } from "../../utils/create-bearer-token";
import { versionInfo } from "graphql";

describe("Federation and authorization", () => {
    test("type level", async () => {
        if (versionInfo.major < 16) {
            console.log("GraphQL version is <16, skipping Federation tests");
            return;
        }

        const typeDefs = gql`
            extend schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key"])

            type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) @key(fields: "id") {
                id: ID!
                name: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });

        const query = gql`
            query ($representations: [_Any!]!) {
                _entities(representations: $representations) {
                    ... on User {
                        id
                        name
                    }
                }
            }
        `;

        const variableValues = { representations: [{ __typename: "User", id: "user" }] };

        const token = createBearerToken("secret", { sub: "user" });

        const result = await translateQuery(neoSchema, query, {
            contextValues: { token },
            variableValues,
            subgraph: true,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE (this.id = $param0 AND ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)))
            RETURN this { .id, .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"user\\"
                },
                \\"jwtDefault\\": {}
            }"
        `);
    });

    test("field level", async () => {
        if (versionInfo.major < 16) {
            console.log("GraphQL version is <16, skipping Federation tests");
            return;
        }

        const typeDefs = gql`
            extend schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key"])

            type User @key(fields: "id") {
                id: ID!
                name: String!
                password: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });

        const query = gql`
            query ($representations: [_Any!]!) {
                _entities(representations: $representations) {
                    ... on User {
                        id
                        name
                        password
                    }
                }
            }
        `;

        const variableValues = { representations: [{ __typename: "User", id: "user" }] };

        const token = createBearerToken("secret", { sub: "user" });

        const result = await translateQuery(neoSchema, query, {
            contextValues: { token },
            variableValues,
            subgraph: true,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id = $param0
            WITH *
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            RETURN this { .id, .name, .password } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"user\\"
                },
                \\"jwtDefault\\": {}
            }"
        `);
    });

    test("with filter requiring subquery", async () => {
        if (versionInfo.major < 16) {
            console.log("GraphQL version is <16, skipping Federation tests");
            return;
        }

        const typeDefs = gql`
            extend schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key"])

            type User @key(fields: "id") {
                id: ID!
                name: String!
            }

            type Post
                @authorization(filter: [{ where: { node: { authorsAggregate: { count_GT: 2 } } } }])
                @key(fields: "id") {
                id: ID!
                content: String!
                authors: [User!]! @relationship(type: "AUTHORED", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });

        const query = gql`
            query ($representations: [_Any!]!) {
                _entities(representations: $representations) {
                    ... on Post {
                        id
                        content
                    }
                }
            }
        `;

        const variableValues = { representations: [{ __typename: "Post", id: "1" }] };

        const token = createBearerToken("secret", { sub: "user" });

        const result = await translateQuery(neoSchema, query, {
            contextValues: { token },
            variableValues,
            subgraph: true,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:AUTHORED]-(this1:User)
                RETURN count(this1) > $param0 AS var2
            }
            WITH *
            WHERE (this.id = $param1 AND ($isAuthenticated = true AND var2 = true))
            RETURN this { .id, .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 2,
                \\"param1\\": \\"1\\",
                \\"isAuthenticated\\": true
            }"
        `);
    });
});

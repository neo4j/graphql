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
import { TestSubscriptionsEngine } from "../../utils/TestSubscriptionsEngine";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("Subscriptions metadata on create", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;
    let plugin: TestSubscriptionsEngine;

    beforeAll(() => {
        plugin = new TestSubscriptionsEngine();
        typeDefs = gql`
            type Actor {
                id: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            extend type Actor @authorization(validate: [{ when: [AFTER], where: { node: { id: "$jwt.sub" } } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
                authorization: { key: "secret" },
            },
        });
    });
    test("Multi Create", async () => {
        const query = gql`
            mutation {
                createActors(input: [{ id: "1" }, { id: "2" }]) {
                    actors {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", {
            sub: "super_admin",
        });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            WITH [] AS meta
            CREATE (this0:Actor)
            SET this0.id = $this0_id
            WITH meta + { event: \\"create\\", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta, this0
            WITH this0, meta
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND this0.id = coalesce($jwt.sub, $jwtDefault)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0, meta AS this0_meta
            }
            CALL {
            WITH [] AS meta
            CREATE (this1:Actor)
            SET this1.id = $this1_id
            WITH meta + { event: \\"create\\", id: id(this1), properties: { old: null, new: this1 { .* } }, timestamp: timestamp(), typename: \\"Actor\\" } AS meta, this1
            WITH this1, meta
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND this1.id = coalesce($jwt.sub, $jwtDefault)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this1, meta AS this1_meta
            }
            WITH this0, this1, this0_meta + this1_meta AS meta
            RETURN [this0 { .id }, this1 { .id }] AS data, meta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"jwtDefault\\": {},
                \\"this1_id\\": \\"2\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

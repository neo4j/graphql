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
import { toGlobalId } from "../../../src/utils/global-ids";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery } from "../utils/tck-test-utils";

describe("Global nodes", () => {
    test("it should fetch the correct node and fields", async () => {
        const typeDefs = gql`
            type Actor @node(global: true) {
                name: String! @unique
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie @node(global: true) {
                id: ID! @id @alias(property: "dbId")
                title: String! @unique
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: {},
        });
        const query = gql`
            query Node($id: ID!) {
                node(id: $id) {
                    id
                    ... on Movie {
                        title
                    }
                    ... on Actor {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: { id: toGlobalId("Movie", "title", "A River Runs Through It") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.title = $this_title
            RETURN this { .title } as this"
        `);
    });
});

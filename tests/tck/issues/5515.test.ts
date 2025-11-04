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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/5515", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type User
                @authorization(
                    validate: [
                        { operations: [CREATE, DELETE], where: { jwt: { roles_INCLUDES: "admin" } } }
                        { operations: [READ, UPDATE], where: { node: { id: "$jwt.sub" } } }
                    ]
                    filter: [{ where: { node: { id: "$jwt.sub" } } }]
                ) {
                id: ID!
                cabinets: [Cabinet!]! @relationship(type: "HAS_CABINET", direction: OUT)
            }

            type Cabinet @authorization(filter: [{ where: { node: { user: { id: "$jwt.sub" } } } }]) {
                id: ID! @id
                categories: [Category!]! @relationship(type: "HAS_CATEGORY", direction: OUT)
                user: User! @relationship(type: "HAS_CABINET", direction: IN)
            }

            type Category @authorization(filter: [{ where: { node: { cabinet: { user: { id: "$jwt.sub" } } } } }]) {
                id: ID! @id
                files: [File!]! @relationship(type: "HAS_FILE", direction: OUT)
                cabinet: Cabinet! @relationship(type: "HAS_CATEGORY", direction: IN)
            }

            type File {
                id: ID! @unique
                category: Category @relationship(type: "HAS_FILE", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should delete categories with auth filters", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteCategories(where: { id: "category-video" }) {
                    __typename
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Category)
            CALL {
                WITH this
                MATCH (this)<-[:HAS_CATEGORY]-(this0:Cabinet)
                OPTIONAL MATCH (this0)<-[:HAS_CABINET]-(this1:User)
                WITH *, count(this1) AS userCount
                WITH *
                WHERE (userCount <> 0 AND ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub))
                RETURN count(this0) = 1 AS var2
            }
            WITH *
            WHERE (this.id = $param1 AND ($isAuthenticated = true AND var2 = true))
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"jwt\\": {},
                \\"param1\\": \\"category-video\\",
                \\"isAuthenticated\\": false
            }"
        `);
    });
});

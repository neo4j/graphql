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

describe("https://github.com/neo4j/graphql/issues/4450", () => {
    test("filtering through a connection to a many-to-1 relationship should work", async () => {
        const typeDefs = /* GraphQL */ `
            type Actor {
                name: String
                scene: [Scene!]! @relationship(type: "IN_SCENE", properties: "ActorScene", direction: OUT)
            }

            type Scene {
                number: Int
                actors: [Actor!]! @relationship(type: "IN_SCENE", properties: "ActorScene", direction: IN)
                location: Location! @relationship(type: "AT_LOCATION", direction: OUT)
            }

            type Location {
                city: String
                scenes: [Scene!]! @relationship(type: "AT_LOCATION", direction: IN)
            }

            type ActorScene @relationshipProperties {
                cut: Boolean
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
            query {
                actors(where: { sceneConnection_SOME: { edge: { cut: true }, node: { location: { city: "test" } } } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:IN_SCENE]->(this1:Scene)
                OPTIONAL MATCH (this1)-[:AT_LOCATION]->(this2:Location)
                WITH *, count(this2) AS locationCount
                WITH *
                WHERE ((locationCount <> 0 AND this2.city = $param0) AND this0.cut = $param1)
                RETURN count(this1) > 0 AS var3
            }
            WITH *
            WHERE var3 = true
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test\\",
                \\"param1\\": true
            }"
        `);
    });
});

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

import gql from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/3215", () => {
    describe("union", () => {
        let neoSchema: Neo4jGraphQL;

        const typeDefs = `#graphql
            type Actor {
                name: String!
                age: Int!
            }
        `;

        beforeAll(() => {
            neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
        });

        test("should ignore undefined parameters on _NOT fields", async () => {
            const query = gql`
                query MyQuery($name: String) {
                    actors(where: { age_GT: 25, name_NOT: $name }) {
                        name
                        age
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Actor\`)
                WHERE this.age > $param0
                RETURN this { .name, .age } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 25,
                        \\"high\\": 0
                    }
                }"
            `);
        });

        test("should ignore undefined parameters on boolean NOT", async () => {
            const query = gql`
                query MyQuery($name: String) {
                    actors(where: { age_GT: 25, NOT: { name: $name } }) {
                        name
                        age
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Actor\`)
                WHERE this.age > $param0
                RETURN this { .name, .age } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 25,
                        \\"high\\": 0
                    }
                }"
            `);
        });
    });
});

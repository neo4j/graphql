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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1756", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface INode {
                id: ID @callback(operations: [CREATE], name: "nanoid")
            }

            type Product implements INode {
                id: ID
                name: String!
                genre: [Genre!]! @relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Genre implements INode {
                id: ID
                value: String! @unique
            }
        `;

        const nanoid = () => {
            return `callback_value`;
        };

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { callbacks: { nanoid } },
        });
    });

    test("should define the ID using the callback function", async () => {
        const query = gql`
            mutation {
                createProducts(
                    input: {
                        name: "TestProduct"
                        genre: {
                            connectOrCreate: [
                                { where: { node: { value: "Action" } }, onCreate: { node: { value: "Action" } } }
                            ]
                        }
                    }
                ) {
                    products {
                        id
                        name
                        genre {
                            id
                            value
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Product)
            SET this0.id = $resolvedCallbacks.this0_id_nanoid
            SET this0.name = $this0_name
            WITH this0
            CALL {
                WITH this0
                MERGE (this0_genre_connectOrCreate_this0:\`Genre\` { value: $this0_genre_connectOrCreate_param0 })
                ON CREATE SET
                    this0_genre_connectOrCreate_this0.value = $this0_genre_connectOrCreate_param1,
                    this0_genre_connectOrCreate_this0.id = $resolvedCallbacks.this0_genre_connectOrCreate_id_nanoid
                MERGE (this0)-[this0_genre_connectOrCreate_this1:HAS_GENRE]->(this0_genre_connectOrCreate_this0)
                RETURN COUNT(*) AS _
            }
            RETURN this0
            }
            CALL {
                WITH this0
                MATCH (this0)-[create_this0:HAS_GENRE]->(this0_genre:\`Genre\`)
                WITH this0_genre { .id, .value } AS this0_genre
                RETURN collect(this0_genre) AS this0_genre
            }
            RETURN [
            this0 { .id, .name, genre: this0_genre }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"TestProduct\\",
                \\"this0_genre_connectOrCreate_param0\\": \\"Action\\",
                \\"this0_genre_connectOrCreate_param1\\": \\"Action\\",
                \\"resolvedCallbacks\\": {
                    \\"this0_id_nanoid\\": \\"callback_value\\",
                    \\"this0_genre_connectOrCreate_id_nanoid\\": \\"callback_value\\"
                }
            }"
        `);
    });
});

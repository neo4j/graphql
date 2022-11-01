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
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher TimeStamps On DateTime Fields", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface MovieInterface {
                interfaceTimestamp: DateTime @timestamp(operations: [CREATE, UPDATE])
                overrideTimestamp: DateTime @timestamp(operations: [CREATE, UPDATE])
            }

            type Movie implements MovieInterface {
                id: ID
                name: String
                createdAt: DateTime @timestamp(operations: [CREATE])
                updatedAt: DateTime @timestamp(operations: [UPDATE])
                interfaceTimestamp: DateTime
                overrideTimestamp: DateTime @timestamp(operations: [CREATE])
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Simple Create", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ id: "123" }]) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var1
            CALL {
                WITH create_var1
                CREATE (create_this0:\`Movie\`)
                SET
                    create_this0.id = create_var1.id,
                    create_this0.createdAt = datetime(),
                    create_this0.interfaceTimestamp = datetime(),
                    create_this0.overrideTimestamp = datetime()
                RETURN create_this0
            }
            RETURN collect(create_this0 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"123\\"
                    }
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Simple Update", async () => {
        const query = gql`
            mutation {
                updateMovies(update: { id: "123", name: "dan" }) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            SET this.updatedAt = datetime()
            SET this.interfaceTimestamp = datetime()
            SET this.id = $this_update_id
            SET this.name = $this_update_name
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_id\\": \\"123\\",
                \\"this_update_name\\": \\"dan\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

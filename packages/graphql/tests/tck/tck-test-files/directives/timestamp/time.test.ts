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
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher TimeStamps On Time Fields", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface MovieInterface {
                interfaceTimestamp: Time @timestamp(operations: [CREATE, UPDATE])
                overrideTimestamp: Time @timestamp(operations: [CREATE, UPDATE])
            }

            type Movie implements MovieInterface {
                id: ID
                name: String
                createdAt: Time @timestamp(operations: [CREATE])
                updatedAt: Time @timestamp(operations: [UPDATE])
                interfaceTimestamp: Time
                overrideTimestamp: Time @timestamp(operations: [CREATE])
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
            "CALL {
            CREATE (this0:Movie)
            SET this0.createdAt = time()
            SET this0.interfaceTimestamp = time()
            SET this0.overrideTimestamp = time()
            SET this0.id = $this0_id
            RETURN this0
            }
            RETURN [
            this0 { .id }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"123\\"
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
            "MATCH (this:Movie)
            SET this.updatedAt = time()
            SET this.interfaceTimestamp = time()
            SET this.id = $this_update_id
            SET this.name = $this_update_name
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_id\\": \\"123\\",
                \\"this_update_name\\": \\"dan\\"
            }"
        `);
    });
});

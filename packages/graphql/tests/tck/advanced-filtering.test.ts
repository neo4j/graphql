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

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, setTestEnvVars, translateQuery, unsetTestEnvVars } from "./utils/tck-test-utils";

describe("Cypher Advanced Filtering", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie {
                _id: ID
                id: ID
                title: String
                actorCount: Int
                budget: BigInt
                genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT)
            }

            type Genre {
                name: String
                movies: [Movie!]! @relationship(type: "IN_GENRE", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                filters: {
                    String: {
                        LT: true,
                        GT: true,
                        LTE: true,
                        GTE: true,
                        MATCHES: true,
                    },
                    ID: {
                        MATCHES: true,
                    },
                },
            },
        });
        setTestEnvVars("NEO4J_GRAPHQL_ENABLE_REGEX=1");
    });

    afterAll(() => {
        unsetTestEnvVars(undefined);
    });

    test("REGEX", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { id_MATCHES: "(?i)123.*" }) {
                    id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id =~ $param0
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"(?i)123.*\\"
            }"
        `);
    });
});

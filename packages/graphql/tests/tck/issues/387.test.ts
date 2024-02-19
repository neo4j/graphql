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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/387", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            scalar URL

            type Place {
                name: String
                url_works: String
                    @cypher(
                        statement: """
                        return '' + '' as result
                        """
                        columnName: "result"
                    )
                url_fails: URL
                    @cypher(
                        statement: """
                        return '' + '' as result
                        """
                        columnName: "result"
                    )
                url_array_works: [String]
                    @cypher(
                        statement: """
                        return ['' + ''] as result
                        """
                        columnName: "result"
                    )
                url_array_fails: [URL]
                    @cypher(
                        statement: """
                        return ['' + ''] as result
                        """
                        columnName: "result"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Should project custom scalars from custom Cypher correctly", async () => {
        const query = gql`
            {
                places {
                    url_works
                    url_fails
                    url_array_works
                    url_array_fails
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Place)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    return '' + '' as result
                }
                WITH result AS this0
                RETURN this0 AS var1
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    return '' + '' as result
                }
                WITH result AS this2
                RETURN this2 AS var3
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    return ['' + ''] as result
                }
                UNWIND result AS var4
                WITH var4 AS this5
                RETURN collect(this5) AS var6
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    return ['' + ''] as result
                }
                UNWIND result AS var7
                WITH var7 AS this8
                RETURN collect(this8) AS var9
            }
            RETURN this { url_works: var1, url_fails: var3, url_array_works: var6, url_array_fails: var9 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});

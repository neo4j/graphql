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
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("#387", () => {
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
                        return '' + ''
                        """
                    )
                url_fails: URL
                    @cypher(
                        statement: """
                        return '' + ''
                        """
                    )
                url_array_works: [String]
                    @cypher(
                        statement: """
                        return ['' + '']
                        """
                    )
                url_array_fails: [URL]
                    @cypher(
                        statement: """
                        return ['' + '']
                        """
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Place\`)
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnSingle(\\"return '' + ''\\", { this: this, auth: $auth }) AS this0
                RETURN head(collect(this0)) AS this0
            }
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnSingle(\\"return '' + ''\\", { this: this, auth: $auth }) AS this1
                RETURN head(collect(this1)) AS this1
            }
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnSingle(\\"return ['' + '']\\", { this: this, auth: $auth }) AS this2
                RETURN collect(this2) AS this2
            }
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnSingle(\\"return ['' + '']\\", { this: this, auth: $auth }) AS this3
                RETURN collect(this3) AS this3
            }
            RETURN this { url_works: this0, url_fails: this1, url_array_works: this2, url_array_fails: this3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
            }"
        `);
    });
});

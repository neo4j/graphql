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

describe("https://github.com/neo4j/graphql/issues/6491", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface VectorGraphic {
                cypherTest: Boolean
                name: String!
            }

            type SVG implements VectorGraphic
                @mutation(operations: [UPDATE, DELETE, CREATE])
                @node(labels: ["SVG", "VectorGraphic"])
                @subscription(events: []) {
                cypherTest: Boolean
                    @cypher(
                        statement: """
                        RETURN this['name'] = 'test' AS result
                        """
                        columnName: "result"
                    )
                name: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("filter over a cypher field", async () => {
        const query = /* GraphQL */ `
            query {
                vectorGraphics(where: { cypherTest: { eq: true } }) {
                    cypherTest
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL (*) {
                MATCH (this0:SVG:VectorGraphic)
                CALL (this0) {
                    CALL (this0) {
                        WITH this0 AS this
                        RETURN this['name'] = 'test' AS result
                    }
                    WITH result AS this1
                    RETURN this1 AS var2
                }
                WITH *
                WHERE var2 = $param0
                CALL (this0) {
                    CALL (this0) {
                        WITH this0 AS this
                        RETURN this['name'] = 'test' AS result
                    }
                    WITH result AS this3
                    RETURN this3 AS var4
                }
                WITH this0 { .name, cypherTest: var4, __resolveType: \\"SVG\\", __id: id(this0) } AS this
                RETURN this
            }
            WITH this
            RETURN this AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true
            }"
        `);
    });
});

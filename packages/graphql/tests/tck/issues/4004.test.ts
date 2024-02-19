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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4004", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Episode {
                id: ID!
            }

            type Series {
                id: ID!
                allEpisodes(options: [Int!]!): [Episode!]!
                    @cypher(
                        statement: """
                        MATCH(this)<-[:IN_SERIES]-(episode:Episode)
                        RETURN episode as n LIMIT $options[0]
                        """
                        columnName: "n"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should query allEpisodes with argument named as options", async () => {
        const query = /* GraphQL */ `
            query {
                series {
                    allEpisodes(options: [2]) {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Series)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH(this)<-[:IN_SERIES]-(episode:Episode)
                    RETURN episode as n LIMIT $param0[0]
                }
                WITH n AS this0
                WITH this0 { .id } AS this0
                RETURN collect(this0) AS var1
            }
            RETURN this { allEpisodes: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"low\\": 2,
                        \\"high\\": 0
                    }
                ]
            }"
        `);
    });
});

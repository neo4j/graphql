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

describe("https://github.com/neo4j/graphql/issues/3905", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Query {
                paths: pathList!
                    @cypher(
                        statement: """
                        WITH [[{entity_id:1, other_entity_id: 2}],[{entity_id: 2, other_entity_id:3},{entity_id:3, other_entity_id: 4}]] as paths
                        RETURN {paths: paths} as result
                        """
                        columnName: "result"
                    )
            }

            type pathList
                @query(read: false, aggregate: false)
                @mutation(operations: [])
                @subscription(events: [])
                @node {
                paths: [[pathLink]]
            }

            type pathLink
                @query(read: false, aggregate: false)
                @mutation(operations: [])
                @subscription(events: [])
                @node {
                entity_id: Int
                other_entity_id: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("custom Cypher query executes and translates as expected", async () => {
        const query = /* GraphQL */ `
            {
                paths {
                    paths {
                        entity_id
                        other_entity_id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                WITH [[{entity_id:1, other_entity_id: 2}],[{entity_id: 2, other_entity_id:3},{entity_id:3, other_entity_id: 4}]] as paths
                RETURN {paths: paths} as result
            }
            WITH result AS this0
            WITH this0 { .paths } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});

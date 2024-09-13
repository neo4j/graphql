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

import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { gql } from "graphql-tag";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/3905", () => {
    test("custom Cypher result type with list of lists generates without error", async () => {
        const typeDefs = gql`
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

            type pathList @query(read: false, aggregate: false) @mutation(operations: []) @subscription(events: []) {
                paths: [[pathLink]]
            }

            type pathLink @query(read: false, aggregate: false) @mutation(operations: []) @subscription(events: []) {
                entity_id: Int
                other_entity_id: Int
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
            }

            type Query {
              paths: pathList!
            }

            type pathLink {
              entity_id: Int
              other_entity_id: Int
            }

            type pathList {
              paths: [[pathLink]]
            }"
        `);
    });
});

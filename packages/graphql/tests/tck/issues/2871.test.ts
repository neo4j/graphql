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

describe("https://github.com/neo4j/graphql/issues/2871", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = /* GraphQL */ `
        type FirstLevel @node {
            id: ID! @id @unique
            secondLevel: SecondLevel! @relationship(type: "HAS_SECOND_LEVEL", direction: OUT)
            createdAt: DateTime! @timestamp(operations: [CREATE])
        }

        type SecondLevel @node {
            id: ID! @id @unique
            thirdLevel: [ThirdLevel!]! @relationship(type: "HAS_THIRD_LEVEL", direction: OUT)
            createdAt: DateTime! @timestamp(operations: [CREATE])
        }

        type ThirdLevel @node {
            id: ID! @id @unique
            createdAt: DateTime! @timestamp(operations: [CREATE])
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should be able to filter by SOME nested within single relationship", async () => {
        const query = /* GraphQL */ `
            query {
                firstLevels(where: { secondLevel: { thirdLevel_SOME: { id: "3" } } }) {
                    id
                    createdAt
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:FirstLevel)
            OPTIONAL MATCH (this)-[:HAS_SECOND_LEVEL]->(this0:SecondLevel)
            WITH *, count(this0) AS secondLevelCount
            WITH *
            WHERE (secondLevelCount <> 0 AND EXISTS {
                MATCH (this0)-[:HAS_THIRD_LEVEL]->(this1:ThirdLevel)
                WHERE this1.id = $param0
            })
            RETURN this { .id, createdAt: apoc.date.convertFormat(toString(this.createdAt), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"3\\"
            }"
        `);
    });

    test("should be able to filter by ALL nested within single relationship", async () => {
        const query = /* GraphQL */ `
            query {
                firstLevels(where: { secondLevel: { thirdLevel_ALL: { id: "5" } } }) {
                    id
                    createdAt
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:FirstLevel)
            OPTIONAL MATCH (this)-[:HAS_SECOND_LEVEL]->(this0:SecondLevel)
            WITH *, count(this0) AS secondLevelCount
            WITH *
            WHERE (secondLevelCount <> 0 AND (EXISTS {
                MATCH (this0)-[:HAS_THIRD_LEVEL]->(this1:ThirdLevel)
                WHERE this1.id = $param0
            } AND NOT (EXISTS {
                MATCH (this0)-[:HAS_THIRD_LEVEL]->(this1:ThirdLevel)
                WHERE NOT (this1.id = $param0)
            })))
            RETURN this { .id, createdAt: apoc.date.convertFormat(toString(this.createdAt), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"5\\"
            }"
        `);
    });

    test("should not match if SOME second level relationships meet nested predicates", async () => {
        const query = /* GraphQL */ `
            query {
                firstLevels(where: { secondLevel: { thirdLevel_NONE: { id: "25" } } }) {
                    id
                    createdAt
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:FirstLevel)
            OPTIONAL MATCH (this)-[:HAS_SECOND_LEVEL]->(this0:SecondLevel)
            WITH *, count(this0) AS secondLevelCount
            WITH *
            WHERE (secondLevelCount <> 0 AND NOT (EXISTS {
                MATCH (this0)-[:HAS_THIRD_LEVEL]->(this1:ThirdLevel)
                WHERE this1.id = $param0
            }))
            RETURN this { .id, createdAt: apoc.date.convertFormat(toString(this.createdAt), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"25\\"
            }"
        `);
    });
});

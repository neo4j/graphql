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

describe("#360", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Event @node {
                id: ID!
                name: String
                start: DateTime
                end: DateTime
                activity: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Should exclude undefined members in AND", async () => {
        const query = /* GraphQL */ `
            query ($rangeStart: DateTime, $rangeEnd: DateTime, $activity: String) {
                events(
                    where: {
                        AND: [
                            { start: { gte: $rangeStart } }
                            { start: { lte: $rangeEnd } }
                            { activity: { eq: $activity } }
                        ]
                    }
                ) {
                    start
                    activity
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: { rangeStart: "2021-07-18T00:00:00+0100", rangeEnd: "2021-07-18T23:59:59+0100" },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Event)
            WHERE (this.start >= datetime($param0) AND this.start <= datetime($param1))
            RETURN this { .activity, start: apoc.date.convertFormat(toString(this.start), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2021-07-18T00:00:00+0100\\",
                \\"param1\\": \\"2021-07-18T23:59:59+0100\\"
            }"
        `);
    });

    test("Should exclude undefined members in OR", async () => {
        const query = /* GraphQL */ `
            query ($rangeStart: DateTime, $rangeEnd: DateTime, $activity: String) {
                events(
                    where: {
                        OR: [
                            { start: { gte: $rangeStart } }
                            { start: { lte: $rangeEnd } }
                            { activity: { eq: $activity } }
                        ]
                    }
                ) {
                    start
                    activity
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: { rangeStart: "2021-07-18T00:00:00+0100", rangeEnd: "2021-07-18T23:59:59+0100" },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Event)
            WHERE (this.start >= datetime($param0) OR this.start <= datetime($param1))
            RETURN this { .activity, start: apoc.date.convertFormat(toString(this.start), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2021-07-18T00:00:00+0100\\",
                \\"param1\\": \\"2021-07-18T23:59:59+0100\\"
            }"
        `);
    });
});

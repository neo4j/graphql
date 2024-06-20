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

import { Neo4jGraphQL } from "../../../../src";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher -> vector -> Additional Labels", () => {
    test("simple match with single vector property and static additionalLabels", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @vector(indexes: [{ name: "MovieTitle", property: "movieVector" }])
                @node(labels: ["Movie", "AnotherLabel"]) {
                title: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                movies(vector: { MovieTitle: { phrase: "something AND something" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.vector.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
            WHERE ($param1 IN labels(this0) AND $param2 IN labels(this0))
            RETURN this0 { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something AND something\\",
                \\"param1\\": \\"Movie\\",
                \\"param2\\": \\"AnotherLabel\\"
            }"
        `);
    });

    test("simple match with single vector property and jwt additionalLabels", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @vector(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                @node(labels: ["Movie", "$jwt.label"]) {
                title: String
            }
        `;

        const label = "some-label";

        const secret = "supershhhhhh";

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });

        const query = /* GraphQL */ `
            query {
                movies(vector: { MovieTitle: { phrase: "something AND something" } }) {
                    title
                }
            }
        `;

        const token = createBearerToken(secret, { label });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.vector.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
            WHERE ($param1 IN labels(this0) AND $param2 IN labels(this0))
            RETURN this0 { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something AND something\\",
                \\"param1\\": \\"Movie\\",
                \\"param2\\": \\"some-label\\"
            }"
        `);
    });
});

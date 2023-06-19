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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher -> fulltext -> Additional Labels", () => {
    test("simple match with single fulltext property and static additionalLabels", async () => {
        const typeDefs = gql`
            type Movie
                @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                @node(labels: ["Movie", "AnotherLabel"]) {
                title: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = gql`
            query {
                movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this
            WHERE (\\"Movie\\" IN labels(this) AND \\"AnotherLabel\\" IN labels(this))
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something AND something\\"
            }"
        `);
    });

    test("simple match with single fulltext property and jwt additionalLabels", async () => {
        const typeDefs = gql`
            type Movie
                @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                @node(labels: ["Movie", "$jwt.label"]) {
                title: String
            }
        `;

        const label = "some-label";

        const secret = "supershhhhhh";

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });

        const query = gql`
            query {
                movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                    title
                }
            }
        `;

        const req = createJwtRequest(secret, { label });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this
            WHERE (\\"Movie\\" IN labels(this) AND \\"some-label\\" IN labels(this))
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something AND something\\"
            }"
        `);
    });
});

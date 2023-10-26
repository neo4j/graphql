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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("context-variable-not-always-resolved-on-cypher-queries", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = gql`
        type Expr
            @node(labels: ["Exprlabel", "$context.tenant", "Resource"])
            @mutation(operations: [])
            @limit(default: 100, max: 300) {
            iri: ID! @id @alias(property: "uri")
            realizationOf: Work @relationship(type: "realizationOf", direction: OUT)
        }
        type Work
            @node(labels: ["WorkLabel", "$context.tenant", "Resource"])
            @mutation(operations: [])
            @limit(default: 100, max: 300) {
            iri: ID! @id @alias(property: "uri")
            hasResourceType: [ResourceType!]! @relationship(type: "hasResourceType", direction: OUT)
        }
        type ResourceType @mutation(operations: []) @limit(default: 1, max: 1000) {
            iri: ID! @id @alias(property: "uri")
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should apply dynamic label with filter", async () => {
        const query = gql`
            query {
                exprs(
                    where: { realizationOf: { hasResourceType: { iri: "http://data.somesite.com/crown/test-id" } } }
                    options: { limit: 1 }
                ) {
                    iri
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            contextValues: {
                cypherParams: {
                    tenant: "test",
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Exprlabel:test:Resource)
            WHERE single(this0 IN [(this)-[:realizationOf]->(this0:WorkLabel:test:Resource) WHERE EXISTS {
                MATCH (this0)-[:hasResourceType]->(this1:ResourceType)
                WHERE this1.uri = $param0
            } | 1] WHERE true)
            WITH *
            LIMIT $param1
            RETURN this { iri: this.uri } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"http://data.somesite.com/crown/test-id\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"tenant\\": \\"test\\"
            }"
        `);
    });
});

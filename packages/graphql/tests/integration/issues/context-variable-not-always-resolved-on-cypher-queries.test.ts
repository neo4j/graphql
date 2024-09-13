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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("context-variable-not-always-resolved-on-cypher-queries", () => {
    const testHelper = new TestHelper();

    let expr: UniqueType;
    let work: UniqueType;
    let resourceType: UniqueType;

    beforeAll(async () => {
        expr = testHelper.createUniqueType("Expr");
        work = testHelper.createUniqueType("Work");
        resourceType = testHelper.createUniqueType("ResourceType");

        const typeDefs = `#graphql
                  type ${expr.name}
            @node(labels: ["Exprlabel", "$context.tenant", "Resource"])
            @mutation(operations: [])
            @limit(default: 100, max: 300) {
            """
            IRI
            """
            iri: ID! @id @alias(property: "uri")
            realizationOf: ${work.name} @relationship(type: "realizationOf", direction: OUT)
        }
        type ${work.name}
            @node(labels: ["WorkLabel", "$context.tenant", "Resource"])
            @mutation(operations: [])
            @limit(default: 100, max: 300) {
            """
            IRI
            """
            iri: ID! @id @alias(property: "uri")
            hasResourceType: [${resourceType.name}!]!
                @relationship(type: "hasResourceType", direction: OUT)
        }
        type ${resourceType.name} @mutation(operations: []) @limit(default: 1, max: 1000) {
            iri: ID! @id @alias(property: "uri")
        }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
            `
                CREATE(p1:Exprlabel:context:tenant:Resource:test {uri: "stuff"})
                CREATE (work:WorkLabel:test:Resource {uri: "another-stuff"})
                CREATE (resource:${resourceType.name} {uri: "uri-to-be-found"})
                CREATE (p1)-[:realizationOf]->(work)-[:hasResourceType]->(resource)
                `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should be possible to target a node with dynamic labels in a filter", async () => {
        const query = `#graphql
        query {
                ${expr.plural}(
                    where: {
                        realizationOf: {
                            hasResourceType_SOME: {
                                iri: "uri-to-be-found"
                            }
                        }
                    }
                    options: { limit: 1 }
                ) {
                    iri
                    realizationOf {
                        iri
                        hasResourceType {
                            iri
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: {
                cypherParams: {
                    tenant: "test",
                },
            },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data?.[expr.plural]).toIncludeSameMembers([
            { iri: "stuff", realizationOf: { iri: "another-stuff", hasResourceType: [{ iri: "uri-to-be-found" }] } },
        ]);
    });
});

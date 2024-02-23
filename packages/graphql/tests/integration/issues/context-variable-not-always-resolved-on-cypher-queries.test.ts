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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("context-variable-not-always-resolved-on-cypher-queries", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let session: Session;

    let neoSchema: Neo4jGraphQL;

    const expr = new UniqueType("Expr");
    const work = new UniqueType("Work");
    const resourceType = new UniqueType("ResourceType");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const session = await neo4j.getSession();

        try {
            await session.run(
                `
                CREATE(p1:Exprlabel:context:tenant:Resource:test {uri: "stuff"})
                CREATE (work:WorkLabel:test:Resource {uri: "another-stuff"})
                CREATE (resource:${resourceType.name} {uri: "uri-to-be-found"})
                CREATE (p1)-[:realizationOf]->(work)-[:hasResourceType]->(resource)
                `
            );
        } finally {
            await session.close();
        }
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });
    afterAll(async () => {
        await driver.close();
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({
                cypherParams: {
                    tenant: "test",
                },
            }),
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data?.[expr.plural]).toIncludeSameMembers([
            { iri: "stuff", realizationOf: { iri: "another-stuff", hasResourceType: [{ iri: "uri-to-be-found" }] } },
        ]);
    });
});

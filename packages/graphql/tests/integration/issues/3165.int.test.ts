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
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";
import { Neo4jGraphQLAuthJWTPlugin } from "../../../../plugins/graphql-plugin-auth/src";

describe("https://github.com/neo4j/graphql/issues/3165", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Book: UniqueType;
    let BookTitle_SV: UniqueType;
    let BookTitle_EN: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Book = new UniqueType("Book");
        BookTitle_SV = new UniqueType("BookTitle_SV");
        BookTitle_EN = new UniqueType("BookTitle_EN");

        const typeDefs = `
            type A {
                name: String!
                related: [Related!]! @relationship(type: "PROPERTY_OF", properties: "RelatedProperties", direction: IN)
            }

            type B {
                name: String!
                related: [Related!]! @relationship(type: "PROPERTY_OF", properties: "RelatedProperties", direction: IN)
            }

            union RelatedTarget = A | B

            interface RelatedProperties @relationshipProperties {
                prop: String!
            }

            type Related {
                name: String!
                value: String!
                target: RelatedTarget!
                    @relationship(type: "PROPERTY_OF", properties: "RelatedProperties", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [Book, BookTitle_EN, BookTitle_SV]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("create and query by edge property over an union", async () => {
        const mutation = `
            mutation CreateA {
                createAs(
                    input: {
                        name: "A"
                        related: { create: { edge: { prop: "propvalue" }, node: { name: "Related", value: "value" } } }
                    }
                ) {
                    as {
                        name
                        relatedConnection {
                            edges {
                                prop
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const query = `
            query Relateds {
                relateds(
                    where: {
                        OR: [
                            { targetConnection: { A: { edge: { prop: "propvalue" } } } }
                            { targetConnection: { B: { edge: { prop: "propvalue" } } } }
                        ]
                    }
                ) {
                    name
                }
            }
        `;

        const schema = await neoSchema.getSchema();

        const mutationResult = await graphql({
            schema,
            source: mutation,
            contextValue: neo4j.getContextValues(),
        });

        expect(mutationResult.errors).toBeFalsy();

        const result = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            relateds: [
                {
                    name: "Related",
                },
            ],
        });
    });
});

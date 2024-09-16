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

describe("https://github.com/neo4j/graphql/issues/3165", () => {
    const testHelper = new TestHelper();

    let A: UniqueType;
    let B: UniqueType;
    let Related: UniqueType;

    beforeEach(async () => {
        A = testHelper.createUniqueType("A");
        B = testHelper.createUniqueType("B");
        Related = testHelper.createUniqueType("Related");

        const typeDefs = `
            type ${A} {
                name: String!
                related: [${Related}!]! @relationship(type: "PROPERTY_OF", properties: "RelatedProperties", direction: IN)
            }

            type ${B} {
                name: String!
                related: [${Related}!]! @relationship(type: "PROPERTY_OF", properties: "RelatedProperties", direction: IN)
            }

            union RelatedTarget = ${A} | ${B}

            type RelatedProperties @relationshipProperties {
                prop: String!
            }

            type ${Related} {
                name: String!
                value: String!
                target: RelatedTarget!
                    @relationship(type: "PROPERTY_OF", properties: "RelatedProperties", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("create and query by edge property over an union", async () => {
        const mutation = /* GraphQL */ `
            mutation CreateA {
                ${A.operations.create}(
                    input: {
                        name: "A"
                        related: { create: { edge: { prop: "propvalue" }, node: { name: "Related", value: "value" } } }
                    }
                ) {
                    ${A.plural} {
                        name
                        relatedConnection {
                            edges {
                                properties {
                                    prop
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const query = /* GraphQL */ `
            query Relateds {
                ${Related.plural}(
                    where: {
                        OR: [
                            { targetConnection: { ${A}: { edge: { prop: "propvalue" } } } }
                            { targetConnection: { ${B}: { edge: { prop: "propvalue" } } } }
                        ]
                    }
                ) {
                    name
                }
            }
        `;

        const mutationResult = await testHelper.executeGraphQL(mutation);

        expect(mutationResult.errors).toBeFalsy();

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Related.plural]: [
                {
                    name: "Related",
                },
            ],
        });
    });
});

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

describe("https://github.com/neo4j/graphql/issues/4477", () => {
    const testHelper = new TestHelper();

    let Brand: UniqueType;
    let Service: UniqueType;
    let Collection: UniqueType;

    beforeAll(async () => {
        Brand = testHelper.createUniqueType("Brand");
        Service = testHelper.createUniqueType("Service");
        Collection = testHelper.createUniqueType("Collection");

        const typeDefs = /* GraphQL */ `
            type ${Brand} {
                services: [${Service}!]! @relationship(type: "HAS_SERVICE", direction: OUT)
                name: String!
            }

            type ${Collection} {
                services: [${Service}!]! @relationship(type: "HAS_SERVICE", direction: OUT)
            }

            type ${Service} {
                collection: ${Collection} @relationship(type: "HAS_SERVICE", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
            `
                    CREATE
                        (brand1:${Brand} {name: 'brand1'}),
                        (brand2:${Brand} {name: 'brand2'}),
                        (collection1:${Collection}),
                        (collection2:${Collection}),
                        (service1:${Service}),
                        (service2:${Service}),
                        (service3:${Service}),
                        (service4:${Service}),
                        (brand1)-[:HAS_SERVICE]->(service1),
                        (brand1)-[:HAS_SERVICE]->(service2),
                        (brand2)-[:HAS_SERVICE]->(service3),
                        (brand2)-[:HAS_SERVICE]->(service4),
                        (collection1)-[:HAS_SERVICE]->(service1),
                        (collection1)-[:HAS_SERVICE]->(service2),
                        (collection2)-[:HAS_SERVICE]->(service3)
                `,
            {}
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("filtering by count on an aggregate should work", async () => {
        const query = /* GraphQL */ `
            query {
                ${Brand.plural} {
                    name
                    services(where: { collectionAggregate: { count: 1 } }) {
                        collectionAggregate {
                            count
                        }
                    }
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query);

        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            [Brand.plural]: expect.toIncludeSameMembers([
                {
                    name: "brand1",
                    services: [
                        {
                            collectionAggregate: {
                                count: 1,
                            },
                        },
                        {
                            collectionAggregate: {
                                count: 1,
                            },
                        },
                    ],
                },
                {
                    name: "brand2",
                    services: [
                        {
                            collectionAggregate: {
                                count: 1,
                            },
                        },
                    ],
                },
            ]),
        });
    });
});

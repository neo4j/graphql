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

describe("https://github.com/neo4j/graphql/issues/6917", () => {
    let Actor: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Actor} @node {
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
            CREATE(:${Actor} {name: "Keanu"})
            CREATE(:${Actor} {name: "Pepe"})
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return totalCount and aggregate, without edges", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.operations.connection} {
                    totalCount
                    aggregate {
                        node {
                            name {
                                shortest
                            }
                        }
                        count {
                            nodes
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [Actor.operations.connection]: {
                totalCount: 2,
                aggregate: {
                    node: {
                        name: {
                            shortest: "Pepe",
                        },
                    },
                    count: {
                        nodes: 2,
                    },
                },
            },
        });
    });
});

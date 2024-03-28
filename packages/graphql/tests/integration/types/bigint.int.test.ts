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

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("BigInt", () => {
    const testHelper = new TestHelper();
    let File: UniqueType;

    beforeEach(() => {
        File = testHelper.createUniqueType("File");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("create", () => {
        test("should create an object with a BigInt specified inline in the mutation", async () => {
            const typeDefs = `
                type ${File} {
                  name: String!
                  size: BigInt!
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const name = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    ${File.operations.create}(input: [{ name: "${name}", size: 9223372036854775807 }]) {
                        ${File.plural} {
                            name
                            size
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(create);

            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (f:${File} {name: "${name}"})
                    RETURN f {.name, .size} as f
                `);

            expect((result.records[0] as any).toObject().f).toEqual({
                name,
                size: {
                    high: 2147483647,
                    low: -1,
                },
            });
        });
    });

    describe("read", () => {
        test("should successfully query an node with a BigInt property", async () => {
            const typeDefs = `
                type ${File} {
                  name: String!
                  size: BigInt!
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const name = generate({
                charset: "alphabetic",
            });

            const query = `
                query {
                    ${File.plural}(where: { name: "${name}" }) {
                        name
                        size
                    }
                }
            `;

            await testHelper.executeCypher(`
                   CREATE (f:${File})
                   SET f.name = "${name}"
                   SET f.size = 9223372036854775807
               `);

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data).toEqual({
                [File.plural]: [
                    {
                        name,
                        size: "9223372036854775807",
                    },
                ],
            });
        });

        test("should successfully query an node with a BigInt property using in where", async () => {
            const typeDefs = `
                type ${File} {
                  name: String!
                  size: BigInt!
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const name = generate({
                charset: "alphabetic",
            });

            const query = `
                query {
                    ${File.plural}(where: { size: 8323372036854775807 }) {
                        name
                        size
                    }
                }
            `;

            await testHelper.executeCypher(`
                   CREATE (f:${File})
                   SET f.name = "${name}"
                   SET f.size = 8323372036854775807
               `);

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data).toEqual({
                [File.plural]: [
                    {
                        name,
                        size: "8323372036854775807",
                    },
                ],
            });
        });
    });

    describe("@cypher directive", () => {
        test("should work returning a BigInt property", async () => {
            const name = generate({
                charset: "alphabetic",
            });

            const typeDefs = `
                type ${File} {
                  name: String!
                  size: BigInt! @cypher(statement: """
                      RETURN 9223372036854775807 as result
                  """, columnName:"result")
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const query = `
                query {
                    ${File.plural}(where: { name: "${name}" }) {
                        name
                        size
                    }
                }
            `;

            await testHelper.executeCypher(`
                   CREATE (f:${File})
                   SET f.name = "${name}"
               `);

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data).toEqual({
                [File.plural]: [
                    {
                        name,
                        size: "9223372036854775807",
                    },
                ],
            });
        });
    });
});

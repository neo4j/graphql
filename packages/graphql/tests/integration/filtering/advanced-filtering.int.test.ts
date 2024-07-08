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
import { TestHelper } from "../../utils/tests-helper";

describe("Advanced Filtering", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {
        process.env.NEO4J_GRAPHQL_ENABLE_REGEX = "true"; // this may cause race condition
    });

    afterEach(async () => {
        await testHelper.close();
        delete process.env.NEO4J_GRAPHQL_ENABLE_REGEX;
    });

    describe.each(["ID", "String"] as const)("%s Filtering", (type) => {
        test("should find Movies REGEX", async () => {
            const randomType = testHelper.createUniqueType("Movie");

            const typeDefs = `
                        type ${randomType.name} {
                            property: ${type}
                        }
                    `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    filters: {
                        [type]: {
                            MATCHES: true,
                        },
                    },
                },
            });

            const value = generate({
                readable: true,
                charset: "alphabetic",
            });

            await testHelper.executeCypher(
                `
                            CREATE (:${randomType.name} {property: $value})
                        `,
                { value: `${value}${value}` }
            );

            const query = `
                            {
                                ${randomType.plural}(where: { property_MATCHES: "(?i)${value}.*" }) {
                                    property
                                }
                            }
                        `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
            expect((gqlResult.data as any)[randomType.plural][0].property).toBe(`${value}${value}`);
        });
    });

    describe("String Filtering", () => {
        test("should find Movies GT string", async () => {
            const movieType = testHelper.createUniqueType("Movie");

            const typeDefs = `
                        type ${movieType.name} {
                            title: String
                        }
                    `;

            await testHelper.initNeo4jGraphQL({
                features: {
                    filters: {
                        String: {
                            LT: true,
                            GT: true,
                            LTE: true,
                            GTE: true,
                        },
                    },
                },
                typeDefs,
            });

            const animatrix = "The Animatrix";
            const matrix = "The Matrix";
            const matrixReloaded = "The Matrix Reloaded";
            const matrixRevolutions = "The Matrix Revolutions";

            await testHelper.executeCypher(
                `
                            CREATE (:${movieType.name} {title: $animatrix})
                            CREATE (:${movieType.name} {title: $matrix})
                            CREATE (:${movieType.name} {title: $matrixReloaded})
                            CREATE (:${movieType.name} {title: $matrixRevolutions})
                        `,
                { animatrix, matrix, matrixReloaded, matrixRevolutions }
            );

            const query = `
                            {
                                ${movieType.plural}(where: { title_GT: "${matrix}" }) {
                                    title
                                }
                            }
                        `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[movieType.plural]).toHaveLength(2);
            expect((gqlResult.data as any)[movieType.plural]).toEqual(
                expect.arrayContaining([{ title: matrixReloaded }, { title: matrixRevolutions }])
            );
        });

        test("should find Movies LT string", async () => {
            const movieType = testHelper.createUniqueType("Movie");

            const typeDefs = `
                        type ${movieType.name} {
                            title: String
                        }
                    `;

            await testHelper.initNeo4jGraphQL({
                features: {
                    filters: {
                        String: {
                            LT: true,
                            GT: true,
                            LTE: true,
                            GTE: true,
                        },
                    },
                },
                typeDefs,
            });

            const matrix = "The Matrix";
            const matrixReloaded = "The Matrix Reloaded";
            const matrixRevolutions = "The Matrix Revolutions";
            const matrixResurrections = "The Matrix Resurrections";

            await testHelper.executeCypher(
                `
                            CREATE (:${movieType.name} {title: $matrix})
                            CREATE (:${movieType.name} {title: $matrixReloaded})
                            CREATE (:${movieType.name} {title: $matrixRevolutions})
                            CREATE (:${movieType.name} {title: $matrixResurrections})
                        `,
                { matrix, matrixReloaded, matrixRevolutions, matrixResurrections }
            );

            const query = `
                            {
                                ${movieType.plural}(where: { title_LT: "${matrixRevolutions}" }) {
                                    title
                                }
                            }
                        `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[movieType.plural]).toHaveLength(3);
            expect((gqlResult.data as any)[movieType.plural]).toEqual(
                expect.arrayContaining([{ title: matrix }, { title: matrixReloaded }, { title: matrixResurrections }])
            );
        });

        test("should find Movies GTE string", async () => {
            const movieType = testHelper.createUniqueType("Movie");

            const typeDefs = `
                        type ${movieType.name} {
                            title: String
                        }
                    `;

            await testHelper.initNeo4jGraphQL({
                features: {
                    filters: {
                        String: {
                            LT: true,
                            GT: true,
                            LTE: true,
                            GTE: true,
                        },
                    },
                },
                typeDefs,
            });

            const animatrix = "The Animatrix";
            const matrix = "The Matrix";
            const matrixReloaded = "The Matrix Reloaded";
            const matrixRevolutions = "The Matrix Revolutions";

            await testHelper.executeCypher(
                `
                            CREATE (:${movieType.name} {title: $animatrix})
                            CREATE (:${movieType.name} {title: $matrix})
                            CREATE (:${movieType.name} {title: $matrixReloaded})
                            CREATE (:${movieType.name} {title: $matrixRevolutions})
                        `,
                { animatrix, matrix, matrixReloaded, matrixRevolutions }
            );

            const query = `
                            {
                                ${movieType.plural}(where: { title_GTE: "${matrix}" }) {
                                    title
                                }
                            }
                        `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[movieType.plural]).toHaveLength(3);
            expect((gqlResult.data as any)[movieType.plural]).toEqual(
                expect.arrayContaining([{ title: matrix }, { title: matrixReloaded }, { title: matrixRevolutions }])
            );
        });

        test("should find Movies LTE string", async () => {
            const movieType = testHelper.createUniqueType("Movie");

            const typeDefs = `
                        type ${movieType.name} {
                            title: String
                        }
                    `;

            await testHelper.initNeo4jGraphQL({
                features: {
                    filters: {
                        String: {
                            LT: true,
                            GT: true,
                            LTE: true,
                            GTE: true,
                        },
                    },
                },
                typeDefs,
            });

            const matrix = "The Matrix";
            const matrixReloaded = "The Matrix Reloaded";
            const matrixRevolutions = "The Matrix Revolutions";
            const matrixResurrections = "The Matrix Resurrections";

            await testHelper.executeCypher(
                `
                            CREATE (:${movieType.name} {title: $matrix})
                            CREATE (:${movieType.name} {title: $matrixReloaded})
                            CREATE (:${movieType.name} {title: $matrixRevolutions})
                            CREATE (:${movieType.name} {title: $matrixResurrections})

                        `,
                { matrix, matrixReloaded, matrixRevolutions, matrixResurrections }
            );

            const query = `
                            {
                                ${movieType.plural}(where: { title_LTE: "${matrixRevolutions}" }) {
                                    title
                                }
                            }
                        `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[movieType.plural]).toHaveLength(4);
            expect((gqlResult.data as any)[movieType.plural]).toEqual(
                expect.arrayContaining([
                    { title: matrix },
                    { title: matrixReloaded },
                    { title: matrixRevolutions },
                    { title: matrixResurrections },
                ])
            );
        });
    });
});

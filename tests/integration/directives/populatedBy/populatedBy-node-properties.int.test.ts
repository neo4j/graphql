import { generate } from "randomstring";
import { TestHelper } from "../../../utils/tests-helper";

describe("@populatedBy directive - Node properties", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    describe("@populatedBy - Int", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const int1 = 123456;

            const callback = () => Promise.resolve(int1);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Int! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: int1,
                        },
                    ],
                },
            });
        });

        test("Should use on UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const int1 = 123456;

            const callback = () => Promise.resolve(int1);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Int! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: int1,
                        },
                    ],
                },
            });
        });

        test("Should use on CREATE and UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const int1 = 123456;
            const int2 = 654321;

            let counter = 0;
            const callback = () => {
                counter += 1;

                if (counter === 1) {
                    return Promise.resolve(int1);
                }

                return Promise.resolve(int2);
            };

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Int! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: int1,
                        },
                    ],
                },
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: int2,
                        },
                    ],
                },
            });
        });

        test("should throw an error if callback result is not a number", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("string");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Int! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: 'Int cannot represent non-integer value: "string"',
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });

    describe("@populatedBy - Float", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve(1.1);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Float! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: 1.1,
                        },
                    ],
                },
            });
        });

        test("Should use on UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve(1.2);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Float! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: 1.2,
                        },
                    ],
                },
            });
        });

        test("Should use on CREATE and UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            let counter = 0;
            const callback = () => {
                counter += 1;

                if (counter === 1) {
                    return Promise.resolve(1.3);
                }

                return Promise.resolve(1.4);
            };

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Float! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: 1.3,
                        },
                    ],
                },
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: 1.4,
                        },
                    ],
                },
            });
        });

        test("should throw an error if callback result is not a float", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("string");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Float! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: 'Float cannot represent non numeric value: "string"',
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });

    describe("@populatedBy - String", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const string1 = "string_one";

            const callback = () => Promise.resolve(string1);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: String! @populatedBy(callback: "callback", operations: [CREATE])
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: string1,
                        },
                    ],
                },
            });
        });

        test("Should use on UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const string1 = "string_one";

            const callback = () => Promise.resolve(string1);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: String! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: string1,
                        },
                    ],
                },
            });
        });

        test("Should use on CREATE and UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const string1 = "string_one";
            const string2 = "string_two";

            let counter = 0;
            const callback = () => {
                counter += 1;

                if (counter === 1) {
                    return Promise.resolve(string1);
                }

                return Promise.resolve(string2);
            };

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: String! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: string1,
                        },
                    ],
                },
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: string2,
                        },
                    ],
                },
            });
        });

        test("should error if callback does not return string", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve(1);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: String! @populatedBy(callback: "callback", operations: [CREATE])
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: "String cannot represent a non string value: 1",
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });

    describe("@populatedBy - Boolean", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve(true);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Boolean! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: true,
                        },
                    ],
                },
            });
        });

        test("Should use on UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve(false);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Boolean! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: false,
                        },
                    ],
                },
            });
        });

        test("Should use on CREATE and UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            let counter = 0;
            const callback = () => {
                counter += 1;

                if (counter === 1) {
                    return Promise.resolve(true);
                }

                return Promise.resolve(false);
            };

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Boolean! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: true,
                        },
                    ],
                },
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: false,
                        },
                    ],
                },
            });
        });

        test("should throw an error if callback result is not a boolean", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("string");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Boolean! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: 'Boolean cannot represent a non boolean value: "string"',
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });

    describe("@populatedBy - ID", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("12345");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: ID! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: "12345",
                        },
                    ],
                },
            });
        });

        test("Should use on UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve(12345);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: ID! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: "12345",
                        },
                    ],
                },
            });
        });

        test("Should use on CREATE and UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            let counter = 0;
            const callback = () => {
                counter += 1;

                if (counter === 1) {
                    return Promise.resolve(54321);
                }

                return Promise.resolve("76543");
            };

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: ID! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: "54321",
                        },
                    ],
                },
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: "76543",
                        },
                    ],
                },
            });
        });

        test("should throw an error if callback result is not a number or string", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve(true);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: ID! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: "ID cannot represent value: true",
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });

    describe("@populatedBy - BigInt", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("12345");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: BigInt! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: "12345",
                        },
                    ],
                },
            });
        });

        test("Should use on UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("2147483648");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: BigInt! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: "2147483648",
                        },
                    ],
                },
            });
        });

        test("Should use on CREATE and UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            let counter = 0;
            const callback = () => {
                counter += 1;

                if (counter === 1) {
                    return Promise.resolve("54321");
                }

                return Promise.resolve("76543");
            };

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: BigInt! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: "54321",
                        },
                    ],
                },
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: "76543",
                        },
                    ],
                },
            });
        });

        test("should throw an error if callback result is not a number as a string", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("banana");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: BigInt! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: "Value must be either a BigInt, or a string representing a BigInt value.",
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });

    describe("@populatedBy - DateTime", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const date = new Date(1716458062912);

            const callback = () => Promise.resolve(date.toISOString());

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: DateTime! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: date.toISOString(),
                        },
                    ],
                },
            });
        });

        test("Should use on UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const date = new Date(1716458062912);

            const callback = () => Promise.resolve(date.toISOString());

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: DateTime! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: date.toISOString(),
                        },
                    ],
                },
            });
        });

        test("should throw an error if string is not a DateTime", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("banana");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: DateTime! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: "DateTime cannot represent non temporal value: banana",
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });

    describe("@populatedBy - Date", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const date = new Date(1716458062912);

            const callback = () => Promise.resolve(date.toISOString());

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Date! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: date.toISOString().split("T")[0],
                        },
                    ],
                },
            });
        });

        test("Should use on UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const date = new Date(1716458062912);

            const callback = () => Promise.resolve(date.toISOString());

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Date! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: date.toISOString().split("T")[0],
                        },
                    ],
                },
            });
        });

        test("should throw an error if string is not a Date", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("banana");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Date! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: "Date cannot represent non temporal value: banana",
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });

    describe("@populatedBy - Time", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const date = new Date(1716458062912);

            const callback = () => Promise.resolve(date.toISOString().split("T")[1]);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Time! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: `${date.toISOString().split("T")[1]?.split("Z")[0]}000000Z`,
                        },
                    ],
                },
            });
        });

        test("Should use on UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const date = new Date(1716458062912);

            const callback = () => Promise.resolve(date.toISOString().split("T")[1]);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Time! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: `${date.toISOString().split("T")[1]?.split("Z")[0]}000000Z`,
                        },
                    ],
                },
            });
        });

        test("should throw an error if string is not a Time", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("banana");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Time! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: "Value must be formatted as Time: banana",
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });

    describe("@populatedBy - LocalDateTime", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const date = new Date(1716458062912);

            const callback = () => Promise.resolve(date.toISOString().split("Z")[0]);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: LocalDateTime! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: `${date.toISOString().split("Z")[0]}000000`,
                        },
                    ],
                },
            });
        });

        test("Should use on UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const date = new Date(1716458062912);

            const callback = () => Promise.resolve(date.toISOString().split("Z")[0]);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: LocalDateTime! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: `${date.toISOString().split("Z")[0]}000000`,
                        },
                    ],
                },
            });
        });

        test("should throw an error if string is not a LocalDateTime", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("banana");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: LocalDateTime! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: "Value must be formatted as LocalDateTime: banana",
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });

    describe("@populatedBy - LocalTime", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const date = new Date(1716458062912);

            const callback = () => Promise.resolve(date.toISOString().split("Z")[0]?.split("T")[1]);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: LocalTime! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: `${date.toISOString().split("Z")[0]?.split("T")[1]}000000`,
                        },
                    ],
                },
            });
        });

        test("Should use on UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const date = new Date(1716458062912);

            const callback = () => Promise.resolve(date.toISOString().split("Z")[0]?.split("T")[1]);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: LocalTime! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: `${date.toISOString().split("Z")[0]?.split("T")[1]}000000`,
                        },
                    ],
                },
            });
        });

        test("should throw an error if string is not a LocalTime", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("banana");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: LocalTime! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: "Value must be formatted as LocalTime: banana",
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });

    describe("@populatedBy - Duration", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const duration = `P14M3DT14700S`;

            const callback = () => Promise.resolve(duration);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Duration! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: duration,
                        },
                    ],
                },
            });
        });

        test("Should use on UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const duration = `P14M3DT14700S`;

            const callback = () => Promise.resolve(duration);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Duration! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: duration,
                        },
                    ],
                },
            });
        });

        test("should throw an error if string is not a Duration", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve("banana");

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: Duration! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: "Value must be formatted as Duration: banana",
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });

    describe("@populatedBy - Misc", () => {
        test("should not change the property when returning 'undefined'", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const string1 = "string_one";

            const callback = () => undefined;

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: String @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}", callback: "${string1}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: string1,
                        },
                    ],
                },
            });
        });

        test("should remove property when returning 'null'", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const string1 = "string_one";

            const callback = () => null;

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: String @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}", callback: "${string1}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: null,
                        },
                    ],
                },
            });
        });

        test("should have access to parent in callback function for CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const callback = (parent) => `${parent.title}-slug`;

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID!
                        title: String!
                        slug: String @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieTitle = generate({
                charset: "alphabetic",
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}", title: "${movieTitle}" }]) {
                            ${testMovie.plural} {
                                id
                                title
                                slug
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            title: movieTitle,
                            slug: `${movieTitle}-slug`,
                        },
                    ],
                },
            });
        });

        test("should have access to parent in callback function for UPDATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const callback = (parent) => `${parent.title}-slug`;

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID!
                        title: String!
                        slug: String @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieTitle = "movie_title";

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}", title: "${movieTitle}" }) {
                            ${testMovie.plural} {
                                id
                                title
                                slug
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            title: movieTitle,
                            slug: `${movieTitle}-slug`,
                        },
                    ],
                },
            });
        });

        test("should have access to context as third argument", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const callback = (_parent, _args, context) => context.testValue;

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID!
                        title: String!
                        contextValue: String @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieTitle = "move_title";
            const movieId = "movie_id";
            const testValue = "test_value";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}", title: "${movieTitle}" }]) {
                            ${testMovie.plural} {
                                id
                                title
                                contextValue
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation, {
                contextValue: { testValue },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            title: movieTitle,
                            contextValue: testValue,
                        },
                    ],
                },
            });
        });

        test("should work for lists", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve([1, 2, 3, 4, 5]);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: [Int!]! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            callback: [1, 2, 3, 4, 5],
                        },
                    ],
                },
            });
        });

        test("should throw an error if expecting list but did not", async () => {
            const testMovie = testHelper.createUniqueType("Movie");

            const callback = () => Promise.resolve(1);

            const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} {
                        id: ID
                        callback: [Int!]! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    populatedBy: {
                        callbacks: {
                            callback,
                        },
                    },
                },
            });

            const movieId = "movie_id";

            const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

            const result = await testHelper.executeGraphQL(mutation);

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: "Expected list as callback result but did not.",
                }),
            ]);
            expect(result.data).toBeNull();
        });
    });
});

import type { Neo4jGraphQLContext } from "../../../../src";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("@populatedBy directive - operation parameters", () => {
    const testHelper = new TestHelper();

    let testMovie: UniqueType;

    beforeEach(async () => {
        testMovie = testHelper.createUniqueType("Movie");

        const callback = (
            parent: Record<string, unknown> | undefined,
            args: Record<string, never>,
            context: Neo4jGraphQLContext & { populatedByOperation: "CREATE" | "UPDATE" }
        ) => {
            return Promise.resolve(context.populatedByOperation);
        };

        const typeDefs = /* GraphQL */ `
                    type ${testMovie.name} @node {
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
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Use create operation in callback", async () => {
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
                        callback: "CREATE",
                    },
                ],
            },
        });
    });

    test("Use update operation in callback", async () => {
        const movieId = "movie_id";

        await testHelper.executeCypher(`CREATE(:${testMovie} {id: "test-id"})`);

        const mutation = `
                    mutation {
                        ${testMovie.operations.update}(update: { id: {set: "${movieId}"} }) {
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
            [testMovie.operations.update]: {
                [testMovie.plural]: [
                    {
                        id: movieId,
                        callback: "UPDATE",
                    },
                ],
            },
        });
    });
});

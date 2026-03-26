/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../../utils/create-bearer-token";
import { TestHelper } from "../../../utils/tests-helper";

describe("Node directive labels", () => {
    const testHelper = new TestHelper();

    const typeFilm = testHelper.createUniqueType("Film");

    beforeEach(async () => {
        await testHelper.executeCypher(`CREATE (m:${typeFilm.name} {title: "The Matrix",year:1999})`);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("custom labels", async () => {
        const typeDefs = `type Movie @node(labels: ["${typeFilm.name}"]) {
            id: ID
            title: String
        }`;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const query = `query {
            movies {
                title
                }
            }`;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data.movies[0]).toEqual({
            title: "The Matrix",
        });
    });

    test("custom jwt labels", async () => {
        const typeDefs = `type Movie @node(labels: ["$jwt.filmLabel"]) {
            id: ID
            title: String
        }`;

        const secret = "1234";

        const token = createBearerToken(secret, { filmLabel: typeFilm.name });

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `query {
            movies {
                title
                }
            }`;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data.movies[0]).toEqual({
            title: "The Matrix",
        });
    });

    test("custom context labels", async () => {
        const typeDefs = `type Movie @node(labels: ["$context.filmLabel"]) {
            id: ID
            title: String
        }`;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const query = `query {
            movies {
                title
                }
            }`;

        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: {
                filmLabel: typeFilm.name,
            },
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data.movies[0]).toEqual({
            title: "The Matrix",
        });
    });
});

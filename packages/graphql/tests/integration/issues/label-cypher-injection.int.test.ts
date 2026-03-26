/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../utils/create-bearer-token";
import { TestHelper } from "../../utils/tests-helper";

describe("Label cypher injection", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should escape the label name passed in context", async () => {
        const typeMovie = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${typeMovie} @node(labels: ["$context.label"])  {
                title: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const query = `
        query {
            ${typeMovie.plural} {
                title
            }
        }
        `;

        const res = await testHelper.executeGraphQL(query, {
            contextValue: {
                label: "Movie\\u0060) MATCH",
            },
        });

        expect(res.errors).toBeUndefined();
    });

    test("should escape the label name passed through jwt", async () => {
        const typeMovie = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${typeMovie} @node(labels: ["$jwt.label"]) {
                title: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "1234",
                },
            },
        });

        const query = `
        query {
            ${typeMovie.plural} {
                title
            }
        }
        `;

        const token = createBearerToken("1234", { label: "Movie\\u0060) MATCH" });

        const res = await testHelper.executeGraphQLWithToken(query, token);

        expect(res.errors).toBeUndefined();
    });
});

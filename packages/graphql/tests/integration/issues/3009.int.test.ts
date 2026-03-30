/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/3009", () => {
    let User: UniqueType;
    const testHelper = new TestHelper();

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("custom resolvers should correctly format dates", async () => {
        const typeDefs = `
            type ${User} @node {
                joinedAt: Date!
            }
        `;

        const resolvers = { Query: { [User.plural]: () => [{ joinedAt: "2020-01-01" }] } };
        await testHelper.initNeo4jGraphQL({ typeDefs, resolvers });

        const query = `
            query {
                ${User.plural} {
                    joinedAt
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({ [User.plural]: [{ joinedAt: "2020-01-01" }] });
    });

    test("custom resolvers should correctly format dateTimes", async () => {
        const typeDefs = `
            type ${User} @node {
                joinedAt: DateTime!
            }
        `;

        const resolvers = { Query: { [User.plural]: () => [{ joinedAt: new Date("2020-01-01").toISOString() }] } };
        await testHelper.initNeo4jGraphQL({ typeDefs, resolvers });

        const query = `
            query {
                ${User.plural} {
                    joinedAt
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({ [User.plural]: [{ joinedAt: "2020-01-01T00:00:00.000Z" }] });
    });
});

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("enum filtering", () => {
    let Movie: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            enum Genre {
                THRILLER,
                COMEDY
                SCIFI
            }

            type ${Movie} @node {
                title: String!
                genre: Genre!
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("filter by eq", async () => {
        await testHelper.executeCypher(`CREATE (:${Movie} {title: "The Matrix", genre: "SCIFI"})
            CREATE(:${Movie} {title: "Johnny English", genre: "COMEDY"})`);

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: {genre: {eq: COMEDY}}) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result).toEqual({
            data: { [Movie.plural]: [{ title: "Johnny English" }] },
        });
    });

    test("filter by not eq", async () => {
        await testHelper.executeCypher(`CREATE (:${Movie} {title: "The Matrix", genre: "SCIFI"})
            CREATE(:${Movie} {title: "Johnny English", genre: "COMEDY"})`);

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: {NOT: {genre: {eq: COMEDY}}}) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result).toEqual({
            data: { [Movie.plural]: [{ title: "The Matrix" }] },
        });
    });
});

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/247", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let User: UniqueType;

    beforeAll(() => {
        Movie = testHelper.createUniqueType("Movie");
        User = testHelper.createUniqueType("User");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return the correct number of results following connect", async () => {
        const typeDefs = gql`
           type ${Movie} @node {
                title: String!
                owners: [${User}!]! @relationship(type: "OWNS", direction: IN)
            }

            type ${User} @node {
                name: String!
                movies: [${Movie}!]! @relationship(type: "OWNS", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const name = generate({ charset: "alphabetic" });

        const title1 = generate({ charset: "alphabetic" });
        const title2 = generate({ charset: "alphabetic" });
        const title3 = generate({ charset: "alphabetic" });

        const createUsers = `
            mutation CreateUser($name: String!) {
                ${User.operations.create}(input: [{ name: $name }]) {
                    ${User.plural} {
                        name
                    }
                }
            }
        `;

        const createMovies = `
            mutation CreateMovies($title1: String!, $title2: String!, $title3: String!) {
                ${Movie.operations.create}(input: [{ title: $title1 }, { title: $title2 }, { title: $title3 }]) {
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

        const connect = `
            mutation Connect($name: String, $title2: String!, $title3: String!) {
                ${User.operations.update}(
                    where: { name_EQ: $name }
                    update: {
                        movies: {
                            connect: {
                                where: { node: { title_IN: [$title2, $title3] } }
                            }
                        }
                    }
                ) {
                    ${User.plural} {
                        name
                        movies {
                            title
                        }
                    }
                }
            }
        `;

        const createUsersResult = await testHelper.executeGraphQL(createUsers, {
            variableValues: { name },
        });

        expect(createUsersResult.errors).toBeFalsy();
        expect((createUsersResult.data as any)[User.operations.create][User.plural]).toEqual([{ name }]);

        const createMoviesResult = await testHelper.executeGraphQL(createMovies, {
            variableValues: { title1, title2, title3 },
        });

        expect(createMoviesResult.errors).toBeFalsy();
        expect((createMoviesResult.data as any)[Movie.operations.create][Movie.plural]).toEqual([
            { title: title1 },
            { title: title2 },
            { title: title3 },
        ]);

        const connectResult = await testHelper.executeGraphQL(connect, {
            variableValues: { name, title2, title3 },
        });

        expect(connectResult.errors).toBeFalsy();
        expect((connectResult.data as any)[User.operations.update][User.plural]).toHaveLength(1);
        expect((connectResult.data as any)[User.operations.update][User.plural][0].name).toEqual(name);
        expect((connectResult.data as any)[User.operations.update][User.plural][0].movies).toHaveLength(2);
        expect((connectResult.data as any)[User.operations.update][User.plural][0].movies).toContainEqual({
            title: title2,
        });
        expect((connectResult.data as any)[User.operations.update][User.plural][0].movies).toContainEqual({
            title: title3,
        });
    });
});

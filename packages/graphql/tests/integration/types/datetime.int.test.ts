/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import neo4jDriver from "neo4j-driver";
import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("DateTime", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("create", () => {
        test("should create a movie (with a DateTime)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} @node {
                  id: ID
                  datetime: DateTime
                }
            `;

            const date = new Date();

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const create = /* GraphQL */ `
                mutation {
                    ${Movie.operations.create}(input: [{ id: "${id}", datetime: "${date.toISOString()}" }]) {
                        ${Movie.plural} {
                            datetime
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(create);

            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (m:${Movie} {id: "${id}"})
                    RETURN m {.id, .datetime} as m
                `);

            const movie: {
                id: string;
                datetime: typeof neo4jDriver.types.DateTime;
            } = (result.records[0] as any).toObject().m;

            expect(movie.id).toEqual(id);
            expect(new Date(movie.datetime.toString()).toISOString()).toEqual(date.toISOString());
        });

        test("should create a movie (with many DateTime)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} @node {
                  id: ID
                  datetimes: [DateTime!]
                }
            `;

            const date = new Date();

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const create = /* GraphQL */ `
                mutation {
                    ${
                        Movie.operations.create
                    }(input: [{ id: "${id}", datetimes: ["${date.toISOString()}", "${date.toISOString()}", "${date.toISOString()}"] }]) {
                        ${Movie.plural} {
                            datetimes
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(create);

            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (m:${Movie} {id: "${id}"})
                    RETURN m {.id, .datetimes} as m
                `);

            const movie: {
                id: string;
                datetimes: (typeof neo4jDriver.types.DateTime)[];
            } = (result.records[0] as any).toObject().m;

            expect(movie.id).toEqual(id);

            movie.datetimes.forEach((dt) => {
                expect(new Date(dt.toString()).toISOString()).toEqual(date.toISOString());
            });
        });
    });

    describe("find", () => {
        test("should find a movie (with a DateTime)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie.name} @node {
                    datetime: DateTime
                }
            `;

            const date = new Date();

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const query = `
                query {
                    ${Movie.plural}(where: { datetime: {eq: "${date.toISOString()}" } }) {
                        datetime
                    }
                }
            `;

            const nDateTime = neo4jDriver.types.DateTime.fromStandardDate(date);

            await testHelper.executeCypher(
                `
                   CREATE (m:${Movie.name})
                   SET m.datetime = $nDateTime
               `,
                { nDateTime }
            );

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[Movie.plural][0]).toEqual({ datetime: date.toISOString() });
        });

        test("should find a movie (with a DateTime created with a timezone)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie.name} @node {
                    name: String
                    datetime: DateTime
                }
            `;

            const date = new Date();

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const query = /* GraphQL */ `
                query {
                    ${Movie.plural}(where: { name: {eq: "${Movie.name}" }}) {
                        datetime
                    }
                }
            `;

            await testHelper.executeCypher(`
                   CREATE (m:${Movie.name})
                   SET m.name = "${Movie.name}"
                   SET m.datetime = datetime("${date.toISOString().replace("Z", "[Etc/UTC]")}")
               `);

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[Movie.plural][0]).toEqual({ datetime: date.toISOString() });
        });
    });

    describe("update", () => {
        test("should update a movie (with a DateTime)", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Movie} @node {
                  id: ID
                  datetime: DateTime
                }
            `;

            const date = new Date();

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const create = /* GraphQL */ `
                mutation {
                    ${
                        Movie.operations.update
                    }(where: {id_EQ: "${id}"}, update: { datetime_SET: "${date.toISOString()}" }) {
                        ${Movie.plural} {
                            id
                            datetime
                        }
                    }
                }
            `;

            await testHelper.executeCypher(`
                    CREATE (m:${Movie} {id: "${id}"})
                `);

            const gqlResult = await testHelper.executeGraphQL(create);

            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (m:${Movie} {id: "${id}"})
                    RETURN m {.id, .datetime} as m
                `);

            const movie: {
                id: string;
                datetime: typeof neo4jDriver.types.DateTime;
            } = (result.records[0] as any).toObject().m;

            expect(movie.id).toEqual(id);
            expect(new Date(movie.datetime.toString()).toISOString()).toEqual(date.toISOString());
        });
    });
});

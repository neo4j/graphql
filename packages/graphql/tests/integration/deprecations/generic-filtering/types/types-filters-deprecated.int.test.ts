import neo4jDriver from "neo4j-driver";
import { generate } from "randomstring";
import { parseDuration } from "../../../../../src/graphql/scalars/Duration";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("types filtering - deprecated", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let File: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
        File = testHelper.createUniqueType("File");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should find a movie (with a Date) - deprecated", async () => {
        const typeDefs = /* GraphQL */ `
        type ${Movie.name} @node {
            date: Date
        }
    `;

        const date = new Date();

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
        query {
            ${Movie.plural}(where: { date_EQ: "${date.toISOString()}" }) {
                date
            }
        }
    `;

        const nDate = neo4jDriver.types.Date.fromStandardDate(date);

        await testHelper.executeCypher(
            `
           CREATE (m:${Movie.name})
           SET m.date = $nDate
       `,
            { nDate }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Movie.plural][0]).toEqual({
            date: date.toISOString().split("T")[0],
        });
    });

    test("should find a movie (with a DateTime) - deprecated", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie.name} @node {
                datetime: DateTime
            }
        `;

        const date = new Date();

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query {
                ${Movie.plural}(where: { datetime_EQ: "${date.toISOString()}" }) {
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

    test("should find a movie (with a DateTime created with a timezone) - deprecated", async () => {
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
                ${Movie.plural}(where: { name_EQ: "${Movie.name}" }) {
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

    test("should filter based on duration equality - deprecated", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                id: ID!
                duration: Duration!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({ readable: false });
        const days = 4;
        const duration = `P${days}D`;
        const parsedDuration = parseDuration(duration);
        const neo4jDuration = new neo4jDriver.types.Duration(0, days, 0, 0);

        await testHelper.executeCypher(
            `
                    CREATE (movie:${Movie})
                    SET movie = $movie
                `,
            { movie: { id, duration: neo4jDuration } }
        );

        const query = /* GraphQL */ `
                query ($id: ID!, $duration: Duration!) {
                    ${Movie.plural}(where: { id_EQ: $id, duration_EQ: $duration }) {
                        id
                        duration
                    }
                }
            `;

        const graphqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, duration },
        });

        expect(graphqlResult.errors).toBeFalsy();

        const graphqlMovie: { id: string; duration: string } = (graphqlResult.data as any)[Movie.plural][0];
        expect(graphqlMovie).toBeDefined();
        expect(graphqlMovie.id).toEqual(id);
        expect(parseDuration(graphqlMovie.duration)).toStrictEqual(parsedDuration);
    });

    test.each(["LT", "LTE", "GT", "GTE"])(
        "should filter based on duration comparison, for filter: %s - deprecated",
        async (filter) => {
            const typeDefs = `
                    type ${Movie} @node {
                        id: ID!
                        duration: Duration!
                    }
                `;
            await testHelper.initNeo4jGraphQL({ typeDefs });

            const longId = generate({ readable: false });
            const long = "P2Y";
            const parsedLong = parseDuration(long);
            const neo4jLong = new neo4jDriver.types.Duration(
                parsedLong.months,
                parsedLong.days,
                parsedLong.seconds,
                parsedLong.nanoseconds
            );

            const mediumId = generate({ readable: false });
            const medium = "P2M";
            const parsedMedium = parseDuration(medium);
            const neo4jMedium = new neo4jDriver.types.Duration(
                parsedMedium.months,
                parsedMedium.days,
                parsedMedium.seconds,
                parsedMedium.nanoseconds
            );

            const shortId = generate({ readable: false });
            const short = "P2D";
            const parsedShort = parseDuration(short);
            const neo4jShort = new neo4jDriver.types.Duration(
                parsedShort.months,
                parsedShort.days,
                parsedShort.seconds,
                parsedShort.nanoseconds
            );

            await testHelper.executeCypher(
                `
                            CREATE (long:${Movie})
                            SET long = $long
                            CREATE (medium:${Movie})
                            SET medium = $medium
                            CREATE (short:${Movie})
                            SET short = $short
                        `,
                {
                    long: { id: longId, duration: neo4jLong },
                    medium: { id: mediumId, duration: neo4jMedium },
                    short: { id: shortId, duration: neo4jShort },
                }
            );

            const query = /* GraphQL */ `
                    query ($where: ${Movie.name}Where!) {
                        ${Movie.plural}(where: $where, sort: [{ duration: ASC }]) {
                            id
                            duration
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(query, {
                variableValues: {
                    where: { id_IN: [longId, mediumId, shortId], [`duration_${filter}`]: medium },
                },
            });

            expect(graphqlResult.errors).toBeUndefined();

            const graphqlMovies: { id: string; duration: string }[] = (graphqlResult.data as any)[Movie.plural];
            expect(graphqlMovies).toBeDefined();

            /* eslint-disable jest/no-conditional-expect */
            if (filter === "LT") {
                expect(graphqlMovies).toHaveLength(1);
                expect(graphqlMovies[0]?.id).toBe(shortId);
                expect(parseDuration(graphqlMovies[0]?.duration as string)).toStrictEqual(parsedShort);
            }

            if (filter === "LTE") {
                expect(graphqlMovies).toHaveLength(2);
                expect(graphqlMovies[0]?.id).toBe(shortId);
                expect(parseDuration(graphqlMovies[0]?.duration as string)).toStrictEqual(parsedShort);

                expect(graphqlMovies[1]?.id).toBe(mediumId);
                expect(parseDuration(graphqlMovies[1]?.duration as string)).toStrictEqual(parsedMedium);
            }

            if (filter === "GT") {
                expect(graphqlMovies).toHaveLength(1);
                expect(graphqlMovies[0]?.id).toBe(longId);
                expect(parseDuration(graphqlMovies[0]?.duration as string)).toStrictEqual(parsedLong);
            }

            if (filter === "GTE") {
                expect(graphqlMovies).toHaveLength(2);
                expect(graphqlMovies[0]?.id).toBe(mediumId);
                expect(parseDuration(graphqlMovies[0]?.duration as string)).toStrictEqual(parsedMedium);

                expect(graphqlMovies[1]?.id).toBe(longId);
                expect(parseDuration(graphqlMovies[1]?.duration as string)).toStrictEqual(parsedLong);
            }
            /* eslint-enable jest/no-conditional-expect */
        }
    );

    test("BigInt should work returning a BigInt property - deprecated", async () => {
        const name = generate({
            charset: "alphabetic",
        });

        const typeDefs = `
            type ${File} @node {
              name: String!
              size: BigInt! @cypher(statement: """
                  RETURN 9223372036854775807 as result
              """, columnName:"result")
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query {
                ${File.plural}(where: { name_EQ: "${name}" }) {
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

    test("float should return normal JS number if the value isInt - deprecated filter", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                id: String
                fakeFloat: Float! @cypher(statement: """
                    RETURN 12345 as result
                """, columnName: "result")
            }


        `;

        const id = generate({
            charset: "alphabetic",
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { id_EQ: "${id}" }){
                    fakeFloat
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (m:${Movie} { id: "${id}" })
            `,
            {}
        );
        const gqlResult = await testHelper.executeGraphQL(query, {});

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Movie.plural][0].fakeFloat).toBe(12345);
    });
});

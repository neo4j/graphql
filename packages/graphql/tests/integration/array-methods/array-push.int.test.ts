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

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import { TestHelper } from "../../utils/tests-helper";

describe("array-push", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    const date = "2024-03-25T11:07:37.122Z";
    const expectedDateOutput = date.split("T")[0];
    const time = "11:38:56.222Z";

    const expectedTimeOutput = `${time.slice(0, -1)}000000Z`;
    const localTime = "22:53:54.955";
    const localDateTime = "2023-05-23T16:26:45.826";
    // Expected localTime and localDateTime may cause flakiness with the ms precision.
    const expectedLocalTime = expect.stringContaining(localTime);
    const expectedLocalDateTime = expect.stringContaining(localDateTime);

    test.each([
        { description: "a single Int element", inputType: "Int", inputValue: 100, expectedOutputValue: [100] },
        {
            description: "a single Int element in an array",
            inputType: "Int",
            inputValue: `[${100}]`,
            expectedOutputValue: [100],
        },
        {
            description: "multiple Int elements",
            inputType: "Int",
            inputValue: `[${100}, ${100}]`,
            expectedOutputValue: [100, 100],
        },
        {
            description: "a single Float element",
            inputType: "Float",
            inputValue: 0.123456,
            expectedOutputValue: [0.123456],
        },
        {
            description: "a single Float element in an array",
            inputType: "Float",
            inputValue: `[${0.123456}]`,
            expectedOutputValue: [0.123456],
        },
        {
            description: "multiple Float elements",
            inputType: "Float",
            inputValue: `[${0.123456}, ${0.123456}]`,
            expectedOutputValue: [0.123456, 0.123456],
        },
        {
            description: "a single String element",
            inputType: "String",
            inputValue: `"tag"`,
            expectedOutputValue: ["tag"],
        },
        {
            description: "a single String element in an array",
            inputType: "String",
            inputValue: `["tag"]`,
            expectedOutputValue: ["tag"],
        },
        {
            description: "multiple String elements",
            inputType: "String",
            inputValue: `["tag1", "tag2"]`,
            expectedOutputValue: ["tag1", "tag2"],
        },
        {
            description: "a single Boolean element",
            inputType: "Boolean",
            inputValue: true,
            expectedOutputValue: [true],
        },
        {
            description: "a single Boolean element in an array",
            inputType: "Boolean",
            inputValue: `[${true}]`,
            expectedOutputValue: [true],
        },
        {
            description: "multiple Boolean elements",
            inputType: "Boolean",
            inputValue: `[${false}, ${true}]`,
            expectedOutputValue: [false, true],
        },
        {
            description: "a single Duration element",
            inputType: "Duration",
            inputValue: `"P2Y"`,
            expectedOutputValue: ["P24M0DT0S"],
        },
        {
            description: "a single Duration element in an array",
            inputType: "Duration",
            inputValue: `["P2Y"]`,
            expectedOutputValue: ["P24M0DT0S"],
        },
        {
            description: "multiple Duration elements",
            inputType: "Duration",
            inputValue: `["P2Y", "P2Y"]`,
            expectedOutputValue: ["P24M0DT0S", "P24M0DT0S"],
        },
        {
            description: "a single Date element",
            inputType: "Date",
            inputValue: `"${date}"`,
            expectedOutputValue: [expectedDateOutput],
        },
        {
            description: "a single Date element in an array",
            inputType: "Date",
            inputValue: `["${date}"]`,
            expectedOutputValue: [expectedDateOutput],
        },
        {
            description: "multiple Date elements",
            inputType: "Date",
            inputValue: `["${date}", "${date}"]`,
            expectedOutputValue: [expectedDateOutput, expectedDateOutput],
        },
        {
            description: "a single Time element",
            inputType: "Time",
            inputValue: `"${time}"`,
            expectedOutputValue: [expectedTimeOutput],
        },
        {
            description: "a single Time element in an array",
            inputType: "Time",
            inputValue: `["${time}"]`,
            expectedOutputValue: [expectedTimeOutput],
        },
        {
            description: "multiple Time elements",
            inputType: "Time",
            inputValue: `["${time}", "${time}"]`,
            expectedOutputValue: [expectedTimeOutput, expectedTimeOutput],
        },
        {
            description: "a single LocalTime element",
            inputType: "LocalTime",
            inputValue: `"${localTime}"`,
            expectedOutputValue: [expectedLocalTime],
        },
        {
            description: "a single LocalTime element in an array",
            inputType: "LocalTime",
            inputValue: `["${localTime}"]`,
            expectedOutputValue: [expectedLocalTime],
        },
        {
            description: "multiple LocalTime elements",
            inputType: "LocalTime",
            inputValue: `["${localTime}", "${localTime}"]`,
            expectedOutputValue: [expectedLocalTime, expectedLocalTime],
        },
        {
            description: "a single DateTime element",
            inputType: "DateTime",
            inputValue: `"${date}"`,
            expectedOutputValue: [date],
        },
        {
            description: "a single DateTime element in an array",
            inputType: "DateTime",
            inputValue: `["${date}"]`,
            expectedOutputValue: [date],
        },
        {
            description: "multiple DateTime elements",
            inputType: "DateTime",
            inputValue: `["${date}", "${date}"]`,
            expectedOutputValue: [date, date],
        },
        {
            description: "a single LocalDateTime element",
            inputType: "LocalDateTime",
            inputValue: `"${localDateTime}"`,
            expectedOutputValue: [expectedLocalDateTime],
        },
        {
            description: "a single LocalDateTime element in an array",
            inputType: "LocalDateTime",
            inputValue: `["${localDateTime}"]`,
            expectedOutputValue: [expectedLocalDateTime],
        },
        {
            description: "multiple LocalDateTime elements",
            inputType: "LocalDateTime",
            inputValue: `["${localDateTime}", "${localDateTime}"]`,
            expectedOutputValue: [expectedLocalDateTime, expectedLocalDateTime],
        },
    ] as const)(
        "should push $description on to an existing array",
        async ({ inputType, inputValue, expectedOutputValue }) => {
            const typeMovie = testHelper.createUniqueType("Movie");

            const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [${inputType}]
            }
        `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const movieTitle = generate({
                charset: "alphabetic",
            });

            const update = `
            mutation {
                ${typeMovie.operations.update} (update: { tags_PUSH: ${inputValue} }) {
                    ${typeMovie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

            const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: []})
        `;

            await testHelper.executeCypher(cypher, { movieTitle });

            const gqlResult = await testHelper.executeGraphQL(update);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[typeMovie.operations.update][typeMovie.plural]).toEqual([
                { title: movieTitle, tags: expectedOutputValue },
            ]);
        }
    );

    const point = {
        longitude: 142.2235,
        latitude: -36.7462,
        height: 0.06816366873681545,
    };

    test.each([
        {
            description: "a single Point element",
            inputType: "Point",
            inputValue: point,
            expectedOutputValue: [point],
        },
        {
            description: "a single Point element in an array",
            inputType: "Point",
            inputValue: [point],
            expectedOutputValue: [point],
        },
        {
            description: "multiple Point elements",
            inputType: "Point",
            inputValue: [point, point],
            expectedOutputValue: [point, point],
        },
    ] as const)(
        "should push $description on to an existing array",
        async ({ inputType, inputValue, expectedOutputValue }) => {
            const typeMovie = testHelper.createUniqueType("Movie");

            const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [${inputType}]
            }
        `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const movieTitle = generate({
                charset: "alphabetic",
            });

            const update = `
            mutation UpdateMovie($inputValue: [${inputType}Input!]!) {
                ${typeMovie.operations.update} (update: { tags_PUSH: $inputValue }) {
                    ${typeMovie.plural} {
                        title
                        tags {
                            latitude
                            longitude
                            height
                        }
                    }
                }
            }
        `;

            const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: []})
        `;

            await testHelper.executeCypher(cypher, { movieTitle });

            const gqlResult = await testHelper.executeGraphQL(update, {
                variableValues: { inputValue },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[typeMovie.operations.update][typeMovie.plural]).toEqual([
                { title: movieTitle, tags: expectedOutputValue },
            ]);
        }
    );

    const cartesianPoint = { x: 0.2822351506911218, y: 0.6583783773239702 };

    test.each([
        {
            description: "a single CartesianPoint element",
            inputType: "CartesianPoint",
            inputValue: cartesianPoint,
            expectedOutputValue: [cartesianPoint],
        },
        {
            description: "a single CartesianPoint element in an array",
            inputType: "CartesianPoint",
            inputValue: [cartesianPoint],
            expectedOutputValue: [cartesianPoint],
        },
        {
            description: "multiple CartesianPoint elements",
            inputType: "CartesianPoint",
            inputValue: [cartesianPoint, cartesianPoint],
            expectedOutputValue: [cartesianPoint, cartesianPoint],
        },
    ] as const)(
        "should push $description on to an existing array",
        async ({ inputType, inputValue, expectedOutputValue }) => {
            const typeMovie = testHelper.createUniqueType("Movie");

            const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [${inputType}]
            }
        `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const movieTitle = generate({
                charset: "alphabetic",
            });

            const update = `
            mutation UpdateMovie($inputValue: [${inputType}Input!]!) {
                ${typeMovie.operations.update} (update: { tags_PUSH: $inputValue }) {
                    ${typeMovie.plural} {
                        title
                        tags {
                            x
                            y
                        }
                    }
                }
            }
        `;

            const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: []})
        `;

            await testHelper.executeCypher(cypher, { movieTitle });

            const gqlResult = await testHelper.executeGraphQL(update, {
                variableValues: { inputValue },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[typeMovie.operations.update][typeMovie.plural]).toEqual([
                { title: movieTitle, tags: expectedOutputValue },
            ]);
        }
    );

    test("should push to two different arrays in the same update", async () => {
        const typeMovie = testHelper.createUniqueType("Movie");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [String]
                moreTags: [String]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${typeMovie.operations.update} (update: { tags_PUSH: ["test"], moreTags_PUSH: ["another test"] }) {
                    ${typeMovie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: [], moreTags: [] })
        `;

        await testHelper.executeCypher(cypher, { movieTitle });

        const gqlResult = await testHelper.executeGraphQL(update);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[typeMovie.operations.update][typeMovie.plural]).toEqual([
            { title: movieTitle, tags: ["test"], moreTags: ["another test"] },
        ]);
    });

    test("should be able to push in a nested update", async () => {
        const actorName = "Luigino";
        const movie = testHelper.createUniqueType("Movie");
        const actor = testHelper.createUniqueType("Actor");
        const typeDefs = `
            type ${movie.name} {
                viewers: [Int]!
                workers: [${actor.name}!]! @relationship(type: "WORKED_IN", direction: IN)
            }
            type ${actor.name} {
                id: ID!
                name: String!
                worksInMovies: [${movie.name}!]! @relationship(type: "WORKED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation($id: ID, $value: [Int]) {
                ${actor.operations.update}(where: { id: $id },
                    update: {
                        worksInMovies: [
                            {
                                update: {
                                    node: {
                                        viewers_PUSH: $value
                                    }
                                }
                            }
                        ]
                    }
                ) {
                    ${actor.plural} {
                        name
                        worksInMovies {
                            viewers
                        }
                    }
                }
            }
        `;

        const cypher = `
            CREATE (a:${movie.name} {viewers: $initialViewers}), (b:${actor.name} {id: $id, name: $name})
            WITH a,b CREATE (a)<-[worksInMovies: WORKED_IN]-(b)
        `;

        await testHelper.executeCypher(cypher, {
            id,
            initialViewers: [],
            name: actorName,
        });

        const gqlResult = await testHelper.executeGraphQL(update, {
            variableValues: { value: [1, 2, 3, 4], id },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[actor.operations.update][actor.plural]).toEqual(
            expect.toIncludeSameMembers([{ name: actorName, worksInMovies: [{ viewers: [1, 2, 3, 4] }] }])
        );
    });

    test("should be possible to update relationship properties", async () => {
        const initialPay = 100;
        const payIncrement = 50;
        const movie = testHelper.createUniqueType("Movie");
        const actor = testHelper.createUniqueType("Actor");
        const typeDefs = `
            type ${movie.name} {
                title: String
                actors: [${actor.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${actor.name} {
                id: ID!
                name: String!
                actedIn: [${movie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                pay: [Float]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation Mutation($id: ID, $payIncrement: [Float]) {
                ${actor.operations.update}(where: { id: $id }, update: {
                    actedIn: [
                        {
                            update: {
                                edge: {
                                    pay_PUSH: $payIncrement
                                }
                            }
                        }
                    ]
                }) {
                    ${actor.plural} {
                        name
                        actedIn {
                            title
                        }
                        actedInConnection {
                            edges {
                                properties {
                                    pay
                                }
                            }
                        }
                    }
                }
            }
        `;

        // Create new movie
        await testHelper.executeCypher(
            `
                CREATE (a:${movie.name} {title: "The Matrix"}), (b:${actor.name} {id: $id, name: "Keanu"}) WITH a,b CREATE (a)<-[actedIn: ACTED_IN{ pay: $initialPay }]-(b) RETURN a, actedIn, b
                `,
            {
                id,
                initialPay: [initialPay],
            }
        );
        // Update movie
        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, payIncrement },
        });

        expect(gqlResult.errors).toBeUndefined();
        const storedValue = await testHelper.executeCypher(
            `
                MATCH(b: ${actor.name}{id: $id}) -[c: ACTED_IN]-> (a: ${movie.name}) RETURN c.pay as pay
                `,
            {
                id,
            }
        );
        expect(storedValue.records[0]?.get("pay")).toEqual([initialPay, payIncrement]);
    });

    test("should be possible to update Point relationship properties", async () => {
        const movie = testHelper.createUniqueType("Movie");
        const actor = testHelper.createUniqueType("Actor");
        const typeDefs = `
            type ${movie.name} {
                title: String
                actors: [${actor.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${actor.name} {
                id: ID!
                name: String!
                actedIn: [${movie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                locations: [Point]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation Mutation($id: ID, $location: [PointInput]) {
                ${actor.operations.update}(where: { id: $id }, update: {
                    actedIn: [
                        {
                            update: {
                                edge: {
                                    locations_PUSH: $location
                                }
                            }
                        }
                    ]
                }) {
                    ${actor.plural} {
                        name
                        actedIn {
                            title
                        }
                        actedInConnection {
                            edges {
                               properties {
                                    locations {
                                        latitude
                                        longitude
                                        height
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        // Create new movie
        await testHelper.executeCypher(
            `
                CREATE (a:${movie.name} {title: "The Matrix"}), (b:${actor.name} {id: $id, name: "Keanu"}) WITH a,b CREATE (a)<-[actedIn: ACTED_IN{ locations: [] }]-(b) RETURN a, actedIn, b
                `,
            {
                id,
            }
        );
        // Update movie
        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, location: [point] },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[actor.operations.update][actor.plural]).toEqual(
            expect.toIncludeSameMembers([
                {
                    name: "Keanu",
                    actedIn: [{ title: "The Matrix" }],
                    actedInConnection: { edges: [{ properties: { locations: [point] } }] },
                },
            ])
        );
    });

    test("should push a single LocalTime element on to an existing array with time ending in 0, which is rounded in response", async () => {
        const localTime = "09:36:55.000";
        const expectedOutputValue = ["09:36:55"];

        const typeMovie = testHelper.createUniqueType("Movie");

        const typeDefs = gql`
        type ${typeMovie} {
            title: String
            tags: [LocalTime]
        }
    `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
        mutation {
            ${typeMovie.operations.update} (update: { tags_PUSH: "${localTime}" }) {
                ${typeMovie.plural} {
                    title
                    tags
                }
            }
        }
    `;

        const cypher = `
        CREATE (m:${typeMovie} {title:$movieTitle, tags: []})
    `;

        await testHelper.executeCypher(cypher, { movieTitle });

        const gqlResult = await testHelper.executeGraphQL(update);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[typeMovie.operations.update][typeMovie.plural]).toEqual([
            { title: movieTitle, tags: expectedOutputValue },
        ]);
    });
});

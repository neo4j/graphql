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

import { faker } from "@faker-js/faker";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver, Session } from "neo4j-driver";
import { generate } from "randomstring";

import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import type { ArrayPushTest } from "./types";
import { UniqueType } from "../../utils/graphql-types";

describe("array-push", () => {
    let driver: Driver;
    let session: Session;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });

    const date = new Date().toISOString();
    const expectedDateOutput = date.split("T")[0];
    const time = faker.date.past().toISOString().split("T")[1] as string;
    const expectedTimeOutput = `${time.slice(0, -1)}000000Z`;
    const localTime = `${faker.date.past().toISOString().split("T")[1]?.split("Z")[0]}`;
    const localDateTime = `${faker.date.past().toISOString().split("Z")[0]}`;
    // Expected localTime and localDateTime may cause flakiness with the ms precision.
    const expectedLocalTime = expect.stringContaining(localTime);
    const expectedLocalDateTime = expect.stringContaining(localDateTime);

    test.each<ArrayPushTest>([
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
    ])("should push $description on to an existing array", async ({ inputType, inputValue, expectedOutputValue }) => {
        const typeMovie = new UniqueType("Movie");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [${inputType}]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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

        await session.run(cypher, { movieTitle });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[typeMovie.operations.update][typeMovie.plural]).toEqual([
            { title: movieTitle, tags: expectedOutputValue },
        ]);
    });

    const point = {
        longitude: parseFloat(faker.address.longitude()),
        latitude: parseFloat(faker.address.latitude()),
        height: faker.datatype.float(),
    };

    test.each<ArrayPushTest>([
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
    ])("should push $description on to an existing array", async ({ inputType, inputValue, expectedOutputValue }) => {
        const typeMovie = new UniqueType("Movie");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [${inputType}]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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

        await session.run(cypher, { movieTitle });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { inputValue },
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[typeMovie.operations.update][typeMovie.plural]).toEqual([
            { title: movieTitle, tags: expectedOutputValue },
        ]);
    });

    const cartesianPoint = {
        x: faker.datatype.float(),
        y: faker.datatype.float(),
    };

    test.each<ArrayPushTest>([
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
    ])("should push $description on to an existing array", async ({ inputType, inputValue, expectedOutputValue }) => {
        const typeMovie = new UniqueType("Movie");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [${inputType}]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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

        await session.run(cypher, { movieTitle });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { inputValue },
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[typeMovie.operations.update][typeMovie.plural]).toEqual([
            { title: movieTitle, tags: expectedOutputValue },
        ]);
    });

    test("should push to two different arrays in the same update", async () => {
        const typeMovie = new UniqueType("Movie");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [String]
                moreTags: [String]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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

        await session.run(cypher, { movieTitle });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

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
        const movie = new UniqueType("Movie");
        const actor = new UniqueType("Actor");
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

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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

        await session.run(cypher, {
            id,
            initialViewers: [],
            name: actorName,
        });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
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
        const movie = new UniqueType("Movie");
        const actor = new UniqueType("Actor");
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

            interface ActedIn @relationshipProperties {
                pay: [Float]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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
                                pay
                            }
                        }
                    }
                }
            }
        `;

        // Create new movie
        await session.run(
            `
                CREATE (a:${movie.name} {title: "The Matrix"}), (b:${actor.name} {id: $id, name: "Keanu"}) WITH a,b CREATE (a)<-[actedIn: ACTED_IN{ pay: $initialPay }]-(b) RETURN a, actedIn, b
                `,
            {
                id,
                initialPay: [initialPay],
            }
        );
        // Update movie
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id, payIncrement },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        const storedValue = await session.run(
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
        const movie = new UniqueType("Movie");
        const actor = new UniqueType("Actor");
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

            interface ActedIn @relationshipProperties {
                locations: [Point]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

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
        `;

        // Create new movie
        await session.run(
            `
                CREATE (a:${movie.name} {title: "The Matrix"}), (b:${actor.name} {id: $id, name: "Keanu"}) WITH a,b CREATE (a)<-[actedIn: ACTED_IN{ locations: [] }]-(b) RETURN a, actedIn, b
                `,
            {
                id,
            }
        );
        // Update movie
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id, location: [point] },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[actor.operations.update][actor.plural]).toEqual(
            expect.toIncludeSameMembers([
                {
                    name: "Keanu",
                    actedIn: [{ title: "The Matrix" }],
                    actedInConnection: { edges: [{ locations: [point] }] },
                },
            ])
        );
    });
});

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

import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4j from "../neo4j";
import type { ArrayPopTest } from "./types";

describe("array-pop", () => {
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

    const dateTime = new Date().toISOString();
    const date = dateTime.split("T")[0];
    const time = faker.date.past().toISOString().split("T")[1] as string;
    const initialTimeValue = `${time.slice(0, -1)}000000Z`;
    const initialLocalTimeValue = `${faker.date.past().toISOString().split("T")[1]?.split("Z")[0]}000000`;
    const initialLocalDateTimeValue = `${faker.date.past().toISOString().split("Z")[0]}000000`;

    test.each<ArrayPopTest>([
        {
            inputType: "Int",
            initialValue: `[100]`,
            expectedOutputValue: [],
        },
        {
            inputType: "Float",
            initialValue: `[0.123456]`,
            expectedOutputValue: [],
        },
        {
            inputType: "String",
            initialValue: `["tag"]`,
            expectedOutputValue: [],
        },
        {
            inputType: "Boolean",
            initialValue: `[${true}]`,
            expectedOutputValue: [],
        },
        {
            inputType: "Duration",
            initialValue: `["P24M0DT0S"]`,
            expectedOutputValue: [],
        },
        {
            inputType: "Date",
            initialValue: `["${date}"]`,
            expectedOutputValue: [],
        },
        {
            inputType: "Time",
            initialValue: `["${initialTimeValue}"]`,
            expectedOutputValue: [],
        },
        {
            inputType: "LocalTime",
            initialValue: `["${initialLocalTimeValue}"]`,
            expectedOutputValue: [],
        },
        {
            inputType: "DateTime",
            initialValue: `["${dateTime}"]`,
            expectedOutputValue: [],
        },
        {
            inputType: "LocalDateTime",
            initialValue: `["${initialLocalDateTimeValue}"]`,
            expectedOutputValue: [],
        },
    ])(
        "should pop a single $inputType element from an array of a single $inputType element",
        async ({ inputType, initialValue, expectedOutputValue }) => {
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
                ${typeMovie.operations.update} (update: { tags_POP: 1 }) {
                    ${typeMovie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

            const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: ${initialValue}})
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
        }
    );

    test.each<ArrayPopTest>([
        {
            inputType: "Int",
            initialValue: `[100, 200]`,
            expectedOutputValue: [100],
        },
        {
            inputType: "Float",
            initialValue: `[0.123456, 0.123456]`,
            expectedOutputValue: [0.123456],
        },
        {
            inputType: "String",
            initialValue: `["tag1", "tag2"]`,
            expectedOutputValue: ["tag1"],
        },
        {
            inputType: "Boolean",
            initialValue: `[${true}, ${false}]`,
            expectedOutputValue: [true],
        },
        {
            inputType: "Duration",
            initialValue: `["P24M0DT0S", "P12M0DT0S"]`,
            expectedOutputValue: ["P24M0DT0S"],
        },
        {
            inputType: "Date",
            initialValue: `["${date}", "${date}"]`,
            expectedOutputValue: [date as string],
        },
        {
            inputType: "Time",
            initialValue: `["${initialTimeValue}", "${initialTimeValue}"]`,
            expectedOutputValue: [initialTimeValue],
        },
        {
            inputType: "LocalTime",
            initialValue: `["${initialLocalTimeValue}", "${initialLocalTimeValue}"]`,
            expectedOutputValue: [initialLocalTimeValue],
        },
        {
            inputType: "DateTime",
            initialValue: `["${dateTime}", "${dateTime}"]`,
            expectedOutputValue: [dateTime],
        },
        {
            inputType: "LocalDateTime",
            initialValue: `["${initialLocalDateTimeValue}", "${initialLocalDateTimeValue}"]`,
            expectedOutputValue: [initialLocalDateTimeValue],
        },
    ])(
        "should pop a single $inputType element from an array of two $inputType elements",
        async ({ inputType, initialValue, expectedOutputValue }) => {
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
                ${typeMovie.operations.update} (update: { tags_POP: 1 }) {
                    ${typeMovie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

            const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: ${initialValue}})
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
        }
    );

    test.each<ArrayPopTest>([
        {
            inputType: "Int",
            initialValue: `[100, 200]`,
            expectedOutputValue: [],
        },
        {
            inputType: "Float",
            initialValue: `[0.123456, 0.123456]`,
            expectedOutputValue: [],
        },
        {
            inputType: "String",
            initialValue: `["tag1", "tag2"]`,
            expectedOutputValue: [],
        },
        {
            inputType: "Boolean",
            initialValue: `[${true}, ${false}]`,
            expectedOutputValue: [],
        },
        {
            inputType: "Duration",
            initialValue: `["P24M0DT0S", "P12M0DT0S"]`,
            expectedOutputValue: [],
        },
        {
            inputType: "Date",
            initialValue: `["${date}", "${date}"]`,
            expectedOutputValue: [],
        },
        {
            inputType: "Time",
            initialValue: `["${initialTimeValue}", "${initialTimeValue}"]`,
            expectedOutputValue: [],
        },
        {
            inputType: "LocalTime",
            initialValue: `["${initialLocalTimeValue}", "${initialLocalTimeValue}"]`,
            expectedOutputValue: [],
        },
        {
            inputType: "DateTime",
            initialValue: `["${date}", "${date}"]`,
            expectedOutputValue: [],
        },
        {
            inputType: "LocalDateTime",
            initialValue: `["${initialLocalDateTimeValue}", "${initialLocalDateTimeValue}"]`,
            expectedOutputValue: [],
        },
    ])(
        "should pop two $inputType elements from an array of two $inputType elements",
        async ({ inputType, initialValue, expectedOutputValue }) => {
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
                ${typeMovie.operations.update} (update: { tags_POP: 2 }) {
                    ${typeMovie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

            const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: ${initialValue}})
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
        }
    );

    const point = {
        longitude: parseFloat(faker.location.longitude().toString()),
        latitude: parseFloat(faker.location.latitude().toString()),
        height: faker.number.float(),
    };

    test.each([
        {
            description: "a single Point element from an array of a single Point element",
            tags: `[
                { longitude: $longitude, latitude: $latitude, height: $height },
            ]`,
            expectedOutputValue: [],
            elementsToPop: 1,
        },
        {
            description: "a single Point element from an array of two Point elements",
            tags: `[
                { longitude: $longitude, latitude: $latitude, height: $height },
                { longitude: $longitude, latitude: $latitude, height: $height }
            ]`,
            expectedOutputValue: [point],
            elementsToPop: 1,
        },
        {
            description: "two Point elements from an array of two Point elements",
            tags: `[
                { longitude: $longitude, latitude: $latitude, height: $height },
                { longitude: $longitude, latitude: $latitude, height: $height }
            ]`,
            expectedOutputValue: [],
            elementsToPop: 2,
        },
    ])("should pop $description", async ({ elementsToPop, tags, expectedOutputValue }) => {
        const typeMovie = new UniqueType("Movie");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [Point]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation CreateMovie($title: String!, $longitude: Float!, $latitude: Float!, $height: Float!) {
                ${typeMovie.operations.create} (input: {
                    title: $title,
                    tags: ${tags}
                }) {
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

        const gqlCreateResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: create,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: {
                title: movieTitle,
                longitude: point.longitude,
                latitude: point.latitude,
                height: point.height,
            },
        });

        if (gqlCreateResult.errors) {
            console.log(JSON.stringify(gqlCreateResult.errors, null, 2));
        }

        expect(gqlCreateResult.errors).toBeUndefined();

        const update = `
            mutation UpdateMovie($elementsToPop: Int!) {
                ${typeMovie.operations.update} (update: { tags_POP: $elementsToPop }) {
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

        const gqlUpdateResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { elementsToPop },
        });

        if (gqlUpdateResult.errors) {
            console.log(JSON.stringify(gqlUpdateResult.errors, null, 2));
        }

        expect(gqlUpdateResult.errors).toBeUndefined();

        expect((gqlUpdateResult.data as any)[typeMovie.operations.update][typeMovie.plural]).toEqual([
            { title: movieTitle, tags: expectedOutputValue },
        ]);
    });

    const cartesianPoint = {
        x: faker.number.float(),
        y: faker.number.float(),
    };

    test.each([
        {
            description: "a single CartesianPoint element from an array of a single CartesianPoint element",
            tags: `[
                { x: $x, y: $y },
            ]`,
            expectedOutputValue: [],
            elementsToPop: 1,
        },
        {
            description: "a single CartesianPoint element from an array of two CartesianPoint elements",
            tags: `[
                { x: $x, y: $y },
                { x: $x, y: $y }
            ]`,
            expectedOutputValue: [cartesianPoint],
            elementsToPop: 1,
        },
        {
            description: "two CartesianPoint elements from an array of two CartesianPoint elements",
            tags: `[
                { x: $x, y: $y },
                { x: $x, y: $y }
            ]`,
            expectedOutputValue: [],
            elementsToPop: 2,
        },
    ])("should pop $description", async ({ elementsToPop, tags, expectedOutputValue }) => {
        const typeMovie = new UniqueType("Movie");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [CartesianPoint]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation CreateMovie($title: String!, $x: Float!, $y: Float!) {
                ${typeMovie.operations.create} (input: {
                    title: $title,
                    tags: ${tags}
                }) {
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

        const gqlCreateResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: create,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: {
                title: movieTitle,
                x: cartesianPoint.x,
                y: cartesianPoint.y,
            },
        });

        if (gqlCreateResult.errors) {
            console.log(JSON.stringify(gqlCreateResult.errors, null, 2));
        }

        expect(gqlCreateResult.errors).toBeUndefined();

        const update = `
            mutation UpdateMovie($elementsToPop: Int!) {
                ${typeMovie.operations.update} (update: { tags_POP: $elementsToPop }) {
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

        const gqlUpdateResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { elementsToPop },
        });

        if (gqlUpdateResult.errors) {
            console.log(JSON.stringify(gqlUpdateResult.errors, null, 2));
        }

        expect(gqlUpdateResult.errors).toBeUndefined();

        expect((gqlUpdateResult.data as any)[typeMovie.operations.update][typeMovie.plural]).toEqual([
            { title: movieTitle, tags: expectedOutputValue },
        ]);
    });

    test("should pop from two different arrays in the same update", async () => {
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
                ${typeMovie.operations.update} (update: { tags_POP: 1, moreTags_POP: 2 }) {
                    ${typeMovie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle, tags: ["abc", "xyz"], moreTags: ["this", "that", "them"] })
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
            { title: movieTitle, tags: ["abc"], moreTags: ["this"] },
        ]);
    });

    test("should be able to pop in a nested update", async () => {
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
            mutation($id: ID, $numberToPop: Int) {
                ${actor.operations.update}(where: { id: $id },
                    update: {
                        worksInMovies: [
                            {
                                update: {
                                    node: {
                                        viewers_POP: $numberToPop
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
            initialViewers: [1, 2],
            name: actorName,
        });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { numberToPop: 1, id },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[actor.operations.update][actor.plural]).toEqual(
            expect.toIncludeSameMembers([{ name: actorName, worksInMovies: [{ viewers: [1] }] }])
        );
    });

    test("should be possible to update relationship properties", async () => {
        const initialPay = 100;
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
            mutation Mutation($id: ID, $numberToPop: Int) {
                ${actor.operations.update}(where: { id: $id }, update: {
                    actedIn: [
                        {
                            update: {
                                edge: {
                                    pay_POP: $numberToPop
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
            variableValues: { id, numberToPop: 1 },
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
        expect(storedValue.records[0]?.get("pay")).toEqual([]);
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
            mutation Mutation($id: ID, $numberToPop: Int) {
                ${actor.operations.update}(where: { id: $id }, update: {
                    actedIn: [
                        {
                            update: {
                                edge: {
                                    locations_POP: $numberToPop
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
                CREATE (a:${movie.name} {title: "The Matrix"}), (b:${actor.name} {id: $id, name: "Keanu"}) WITH a,b CREATE (a)<-[actedIn: ACTED_IN{ locations: [point($initialLocation)] }]-(b) RETURN a, actedIn, b
                `,
            {
                id,
                initialLocation: point,
            }
        );
        // Update movie
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id, numberToPop: 1 },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[actor.operations.update][actor.plural]).toEqual(
            expect.toIncludeSameMembers([
                {
                    name: "Keanu",
                    actedIn: [{ title: "The Matrix" }],
                    actedInConnection: { edges: [{ locations: [] }] },
                },
            ])
        );
    });
});

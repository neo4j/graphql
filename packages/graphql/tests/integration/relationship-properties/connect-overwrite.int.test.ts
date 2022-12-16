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

import type { Driver, Session } from "neo4j-driver";
import { DocumentNode, graphql } from "graphql";
import { gql } from "apollo-server";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

// TODO: rename tests
// TODO: fix expect error messgae
describe("Relationship properties - connect with and without `overwrite`", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    let typeActor: UniqueType;
    let typeMovie: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterEach(async () => {
        const session = await neo4j.getSession();
        await session.run(`MATCH (n) DETACH DELETE n;`);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("Effect on other relationships", () => {
        let session: Session;

        beforeEach(async () => {
            typeActor = generateUniqueType("Actor");
            typeMovie = generateUniqueType("Movie");

            typeDefs = gql`
                type ${typeMovie.name} {
                    title: String!
                    directors: [${typeActor.name}!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                    actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                }

                type ${typeActor.name} {
                    name: String!
                    movies: [ ${typeMovie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
                    directed: [ ${typeMovie.name}!]! @relationship(type: "DIRECTED", properties: "Directed", direction: OUT)
                }

                interface ActedIn {
                    screenTime: Int!
                }
                interface Directed {
                    year: Int!
                }
            `;
            neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
            session = await neo4j.getSession();
        });

        afterEach(async () => {
            await cleanNodes(session, [typeActor, typeMovie]);
            await session.close();
        });

        test("should be length 1 and not overwritten with duplicate bc overwrite=false - other field does not get updated bc of error", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!, $year: Int!, $directorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: [{
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }]
                                },
                                directors: {
                                    connect: [{
                                        where: { node: { name: $directorName } },
                                        edge: { year: $year },
                                    }]
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!, $year: Int!, $directorName: String!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        update: {
                            directors: {
                                connect: {
                                    where: { node: { name: $directorName } },
                                    edge: { year: $year }
                                }
                            },
                            actors: {
                                connect: {
                                    where: { node: { name: $actorName } },
                                    edge: { screenTime: $screenTime },
                                    overwrite: false
                                }
                            }
                        }
                        
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const directorName = "Director 1";
            const year = 2010;
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
                directorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                        CREATE (:${typeActor.name} {name:$directorName})
                    `,
                { actorName: "Actor 1", directorName: "Director 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime, directorName, year },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                    directorsConnection: { edges: [{ year, node: { name: directorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, directorName, year: 2011, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResult2.errors).toBeDefined();
            // [[GraphQLError: Movie.actors required exactly once for a specific Actor]]
            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
            const directorOverwritten = await session.run(
                `MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:DIRECTED {year: $year}]-
                                (d:${typeActor.name} {name: $directorName})
                    RETURN d `,
                { movieTitle, year: 2011, directorName }
            );
            expect(directorOverwritten.records).toHaveLength(0);
        });

        test("should be length 1 and not overwritten with duplicate bc overwrite=false - other field overwrite is ignored bc not duplicate", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!, $year: Int!, $directorName: String!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        update: {
                            directors: {
                                connect: {
                                    where: { node: { name: $directorName } },
                                    edge: { year: $year },
                                    overwrite: false
                                }
                            },
                            actors: {
                                connect: {
                                    where: { node: { name: $actorName } },
                                    edge: { screenTime: $screenTime },
                                    overwrite: false
                                }
                            }
                        }
                        
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const directorName = "Director 1";
            const year = 2010;
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
                directorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                        CREATE (:${typeActor.name} {name:$directorName})
                    `,
                { actorName: "Actor 1", directorName: "Director 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                    directorsConnection: { edges: [] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, directorName, year, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
            const directorOverwritten = await session.run(
                `MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:DIRECTED {year: $year}]-
                                (d:${typeActor.name} {name: $directorName})
                    RETURN d `,
                { movieTitle, year: 2011, directorName }
            );
            expect(directorOverwritten.records).toHaveLength(0);
        });
    });

    describe("Relationships of type 1:*", () => {
        let session: Session;

        beforeEach(async () => {
            typeActor = generateUniqueType("Actor");
            typeMovie = generateUniqueType("Movie");

            typeDefs = gql`
                type ${typeMovie.name} {
                    title: String!
                    actors: ${typeActor.name}! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                }

                type ${typeActor.name} {
                    name: String!
                    movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
                }

                interface ActedIn {
                    screenTime: Int!
                }
            `;
            neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
            session = await neo4j.getSession();
        });

        afterEach(async () => {
            await cleanNodes(session, [typeActor, typeMovie]);
            await session.close();
        });

        // update + update + connect
        test("should be length 1", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const screenTime = 123;

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const cypher = `
                MATCH (m:${typeMovie.name} {title: $movieTitle})
                        <-[:ACTED_IN {screenTime: $screenTime}]-
                            (:${typeActor.name} {name: $actorName})
                RETURN m
            `;

            const neo4jResult = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResult.records).toHaveLength(1);
        });

        test("should be length 1 overwritten with duplicate", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        update: {
                            actors: {
                                connect: {
                                    where: { node: { name: $actorName } },
                                    edge: { screenTime: $screenTime },
                                }
                            }
                        }
                        
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResult2.errors).toBeFalsy();

            expect((gqlResult2.data as any)?.[typeMovie.operations.update][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime: screenTimeUpdate, node: { name: actorName } }] },
                },
            ]);

            const neo4jResultOverwritten = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
            const neo4jResult = await session.run(cypher, { movieTitle, screenTime: screenTimeUpdate, actorName });
            expect(neo4jResult.records).toHaveLength(1);
        });

        test("should be length 1 and not overwritten with duplicate bc overwrite=false", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        update: {
                            actors: {
                                connect: {
                                    where: { node: { name: $actorName } },
                                    edge: { screenTime: $screenTime },
                                    overwrite: false
                                }
                            }
                        }
                        
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResult2.errors).toBeDefined();
            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        // update + connect
        test("update-connect 1:* : should be length 1 and not overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        connect: {
                            actors: {
                                    where: { node: { name: $actorName } },
                                    edge: { screenTime: $screenTime },
                                    overwrite: false
                                }
                        }
                        
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                    `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("update-connect 1:* : should be length 1 and overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        connect: {
                            actors: {
                                    where: { node: { name: $actorName } },
                                    edge: { screenTime: $screenTime },
                                    overwrite: true
                                }
                        }
                        
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                    `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            // expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            expect(gqlResult2.errors).toBeFalsy();

            // expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        test("update-connect *:1 : should be length 1 and not overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeActor.operations.update}(
                        where: {
                            name: $actorName 
                        },
                        connect: {
                            movies: {
                                    where: { node: { title: $movieTitle } },
                                    edge: { screenTime: $screenTime },
                                    overwrite: false
                                }
                        }
                        
                    ) {
                        ${typeActor.plural} {
                            name
                            moviesConnection {
                                edges {
                                    screenTime
                                    node {
                                        title
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                    `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("update-connect *:1 : should be length 1 and overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeActor.operations.update}(
                        where: {
                            name: $actorName 
                        },
                        connect: {
                            movies: {
                                    where: { node: { title: $movieTitle } },
                                    edge: { screenTime: $screenTime },
                                }
                        }
                        
                    ) {
                        ${typeActor.plural} {
                            name
                            moviesConnection {
                                edges {
                                    screenTime
                                    node {
                                        title
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                    `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            // expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            expect(gqlResult2.errors).toBeFalsy();

            // expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        // update + update + connectOrCreate
        test("connectOrCreate: overwrite not an option - should be length 1 and not overwritten", async () => {
            typeDefs = gql`
                type ${typeMovie.name} {
                    title: String!
                    actors: ${typeActor.name}! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                }

                type ${typeActor.name} {
                    name: String!
                    id: Int! @unique
                    movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
                }

                interface ActedIn {
                    screenTime: Int!
                }
            `;
            neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!, $actorId: Int!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        update: {
                            actors: {
                                connectOrCreate: {
                                    where: { node: { id: $actorId } },
                                    onCreate: { edge: { screenTime: $screenTime }, node: { name: $actorName, id: $actorId } },
                                }
                            }
                        }
                        
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                MATCH (m:${typeMovie.name} {title: $movieTitle})
                        <-[:ACTED_IN {screenTime: $screenTime}]-
                            (:${typeActor.name} {name: $actorName, id: $actorId})
                RETURN m
            `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const actorId = 1;
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
                actorId,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName, id:$actorId})
                `,
                { actorName: "Actor 1", actorId }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, actorId },
            });
            // expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            expect(gqlResult2.errors).toBeFalsy();

            // expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName, actorId });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
                actorId,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        // create + connect
        test("create-connect 1:* : should be length 1 and not overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeActor.operations.create}(
                        input: [
                            {
                                name: $actorName,
                                movies: {
                                    connect: {
                                        where: { node: { title: $movieTitle } },
                                        edge: { screenTime: $screenTime },
                                        overwrite: false
                                    }
                                }
                            }
                        ]    
                    ) {
                        ${typeActor.plural} {
                            name
                            moviesConnection {
                                edges {
                                    screenTime
                                    node {
                                        title
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        // ?? breaking?
        test.skip("create-connect 1:* : should be length 1 and overwritten", async () => {
            const source = `
            mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                ${typeMovie.operations.create}(
                    input: [
                        {
                            title: $movieTitle
                            actors: {
                                connect: {
                                    where: { node: { name: $actorName } },
                                    edge: { screenTime: $screenTime },
                                }
                            }
                        }
                    ]
                ) {
                    ${typeMovie.plural} {
                        title
                        actorsConnection {
                            edges {
                                screenTime
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;
            const update = `
            mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                ${typeActor.operations.create}(
                    input: [
                        {
                            name: $actorName,
                            movies: {
                                connect: {
                                    where: { node: { title: $movieTitle } },
                                    edge: { screenTime: $screenTime },
                                }
                            }
                        }
                    ]    
                ) {
                    ${typeActor.plural} {
                        name
                        moviesConnection {
                            edges {
                                screenTime
                                node {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        `;

            const cypher = `
                MATCH (m:${typeMovie.name} {title: $movieTitle})
                        <-[r:ACTED_IN {screenTime: $screenTime}]-
                            (:${typeActor.name} {name: $actorName})
                RETURN r
            `;
            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        // nested connect-connect
        test("create-nested connect 1:* : should be length 1 and not overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieOtherTitle: String!, $movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieOtherTitle,
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName  } },
                                        edge: { screenTime: $screenTime },
                                        connect: {
                                            movies: [{
                                                where: { node: { title: $movieTitle  } },
                                                edge: { screenTime: $screenTime },
                                                overwrite: false
                                            }]
                                        }
                                    }
                                }
                            }
                        ]    
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const movieOtherTitle = "Movie 2";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, movieOtherTitle },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("create-nested connect 1:* : should be length 1 and overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieOtherTitle: String!, $movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieOtherTitle,
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName  } },
                                        edge: { screenTime: $screenTime },
                                        connect: {
                                            movies: [{
                                                where: { node: { title: $movieTitle  } },
                                                edge: { screenTime: $screenTime },
                                            }]
                                        }
                                    }
                                }
                            }
                        ]    
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const movieOtherTitle = "Movie 2";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, movieOtherTitle },
            });
            // expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            expect(gqlResult2.errors).toBeFalsy();

            // expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        test("create-nested connect 1:1 : should be length 1 and overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieOtherTitle: String!, $movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieOtherTitle,
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName  } },
                                        edge: { screenTime: $screenTime },
                                        connect: {
                                            movies: [{
                                                where: { node: { title: $movieTitle  } },
                                                edge: { screenTime: $screenTime },
                                                connect: {
                                                    actors: {
                                                        where: { node: { name: $actorName  } },
                                                        edge: { screenTime: $screenTime },
                                                    }
                                                }
                                            }]
                                        }
                                    }
                                }
                            }
                        ]    
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const movieOtherTitle = "Movie 2";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, movieOtherTitle },
            });
            // expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            expect(gqlResult2.errors).toBeFalsy();

            // expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        test("create-nested connect 1:1 : should be length 1 and not overwritten", async () => {
            const source = `
            mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                ${typeMovie.operations.create}(
                    input: [
                        {
                            title: $movieTitle
                            actors: {
                                connect: {
                                    where: { node: { name: $actorName } },
                                    edge: { screenTime: $screenTime },
                                }
                            }
                        }
                    ]
                ) {
                    ${typeMovie.plural} {
                        title
                        actorsConnection {
                            edges {
                                screenTime
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;
            const update = `
            mutation($movieOtherTitle: String!, $movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                ${typeMovie.operations.create}(
                    input: [
                        {
                            title: $movieOtherTitle,
                            actors: {
                                connect: {
                                    where: { node: { name: $actorName  } },
                                    edge: { screenTime: $screenTime },
                                    connect: {
                                        movies: [{
                                            where: { node: { title: $movieTitle  } },
                                            edge: { screenTime: $screenTime },
                                            connect: {
                                                actors: {
                                                    where: { node: { name: $actorName  } },
                                                    edge: { screenTime: $screenTime },
                                                    overwrite: false
                                                }
                                            }
                                        }]
                                    }
                                }
                            }
                        }
                    ]    
                ) {
                    ${typeMovie.plural} {
                        title
                        actorsConnection {
                            edges {
                                screenTime
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

            const cypher = `
                MATCH (m:${typeMovie.name} {title: $movieTitle})
                        <-[:ACTED_IN {screenTime: $screenTime}]-
                            (:${typeActor.name} {name: $actorName})
                RETURN m
            `;

            const movieTitle = "Movie 1";
            const movieOtherTitle = "Movie 2";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, movieOtherTitle },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        // update connect-connect
        test("update-nested connect 1:* : should be length 1 and overwritten twice", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($screenTimeOther: Int!, $movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        connect: {
                            actors: {
                                where: { node: { name: $actorName  } },
                                edge: { screenTime: $screenTime },
                                connect: {
                                    movies: [{
                                        where: { node: { title: $movieTitle  } },
                                        edge: { screenTime: $screenTimeOther },
                                    }]
                                }
                            }
                        }  
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;
            const screenTimeOther = 156;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, screenTimeOther },
            });
            // expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            expect(gqlResult2.errors).toBeFalsy();

            // expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwrittenOnce = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwrittenOnce.records).toHaveLength(0);
            const neo4jResultOverwrittenTwice = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeOther,
                actorName,
            });
            expect(neo4jResultOverwrittenTwice.records).toHaveLength(1);
        });

        test("update-nested connect 1:* : should be length 1 and not overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($screenTimeOther: Int!, $movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        connect: {
                            actors: {
                                where: { node: { name: $actorName  } },
                                edge: { screenTime: $screenTime },
                                connect: {
                                    movies: [{
                                        where: { node: { title: $movieTitle  } },
                                        edge: { screenTime: $screenTimeOther },
                                        overwrite: false
                                    }]
                                }
                            }
                        }  
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;
            const screenTimeOther = 156;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, screenTimeOther },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwrittenOnce = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwrittenOnce.records).toHaveLength(0);
            const neo4jResultOverwrittenTwice = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeOther,
                actorName,
            });
            expect(neo4jResultOverwrittenTwice.records).toHaveLength(0);
        });

        test("update-nested connect 1:* : should be length 1 and not overwritten bc entire mutation fails", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($screenTimeOther: Int!, $movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        connect: {
                            actors: {
                                where: { node: { name: $actorName  } },
                                edge: { screenTime: $screenTime },
                                connect: {
                                    movies: [{
                                        where: { node: { title: $movieTitle  } },
                                        edge: { screenTime: $screenTimeOther },
                                        overwrite: false
                                    }]
                                }
                            }
                        }  
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                MATCH (m:${typeMovie.name} {title: $movieTitle})
                        <-[:ACTED_IN {screenTime: $screenTime}]-
                            (:${typeActor.name} {name: $actorName})
                RETURN m
            `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;
            const screenTimeOther = 156;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, screenTimeOther },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwrittenOnce = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwrittenOnce.records).toHaveLength(0);
            const neo4jResultOverwrittenTwice = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeOther,
                actorName,
            });
            expect(neo4jResultOverwrittenTwice.records).toHaveLength(0);
        });

        // update - create - connect
        test("update-create-nested connect 1:* : should be length 1 and not overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                actors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { screenTime: $screenTime },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($screenTimeOther: Int!, $movieTitle: String!, $movieTitleOther: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeActor.operations.update}(
                        where: {
                            name: $actorName
                        },
                        create: {
                            movies: [
                                {
                                    edge: { screenTime: $screenTime },
                                    node: {
                                        title: $movieTitleOther
                                        actors: {
                                            connect: {
                                                where: { node: { name: $actorName  } },
                                                edge: { screenTime: $screenTimeOther },
                                                connect: {
                                                    movies: [{
                                                        where: { node: { title: $movieTitle  } },
                                                        edge: { screenTime: $screenTimeOther },
                                                        overwrite: false
                                                    }]
                                                },
                                            }
                                        }
                                    }  
                                }
                            ]
                        }  
                    ) {
                        ${typeActor.plural} {
                            name
                            moviesConnection {
                                edges {
                                    screenTime
                                    node {
                                        title
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:ACTED_IN {screenTime: $screenTime}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const movieTitleOther = "Movie 2";
            const actorName = "Actor 1";
            const screenTime = 123;
            const screenTimeUpdate = 134;
            const screenTimeOther = 156;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:${typeActor.name} {name:$actorName})
                `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    movieTitle,
                    actorName,
                    screenTime: screenTimeUpdate,
                    screenTimeOther,
                    movieTitleOther,
                },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            // expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });
    });

    describe("Relationships of type *:*", () => {
        let session: Session;

        beforeEach(async () => {
            typeActor = generateUniqueType("Actor");
            typeMovie = generateUniqueType("Movie");

            typeDefs = gql`
                type ${typeMovie.name} {
                    title: String!
                    directors: [${typeActor.name}!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                }

                type ${typeActor.name} {
                    name: String!
                    directed: [${typeMovie.name}!]! @relationship(type: "DIRECTED", properties: "Directed", direction: OUT)
                }

                interface Directed {
                    year: Int!
                }
            `;
            neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
            session = await neo4j.getSession();
        });

        afterEach(async () => {
            await cleanNodes(session, [typeActor, typeMovie]);
            await session.close();
        });

        // update + update + connect
        test("*:* - should be length 1 and not overwritten with duplicate bc overwrite=false", async () => {
            const source = `
                mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                directors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { year: $year },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        update: {
                            directors: {
                                connect: {
                                    where: { node: { name: $actorName } },
                                    edge: { year: $year },
                                    overwrite: false
                                }
                            }
                        }  
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:DIRECTED {year: $year}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const year = 2010;
            const yearOther = 2011;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                actorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                    `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, year },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    directorsConnection: { edges: [{ year, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, year: yearOther, actorName },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("*:* - should be length 1 and overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                directors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { year: $year },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        update: {
                            directors: {
                                connect: {
                                    where: { node: { name: $actorName } },
                                    edge: { year: $year }
                                }
                            }
                        }  
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:DIRECTED {year: $year}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const year = 2010;
            const yearOther = 2011;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                actorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                    `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, year },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    directorsConnection: { edges: [{ year, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, year: yearOther, actorName },
            });
            // expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            expect(gqlResult2.errors).toBeFalsy();

            // expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        // update + connect
        test("update-connect *:* - should be length 1 and overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                directors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { year: $year },
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                    ${typeActor.operations.update}(
                        where: {
                            name: $actorName 
                        },
                        connect: {
                            directed: {
                                where: { node: { title: $movieTitle } },
                                edge: { year: $year }
                            }
                        }  
                    ) {
                        ${typeActor.plural} {
                            name
                            directedConnection {
                                edges {
                                    year
                                    node {
                                        title
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:DIRECTED {year: $year}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const year = 2010;
            const yearOther = 2011;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                actorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                    `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, year },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    directorsConnection: { edges: [{ year, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, year: yearOther, actorName },
            });
            // expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            expect(gqlResult2.errors).toBeFalsy();

            // expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        test("update-connect *:* - should be length 1 and not overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                directors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { year: $year }
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                    ${typeActor.operations.update}(
                        where: {
                            name: $actorName 
                        },
                        connect: {
                            directed: {
                                where: { node: { title: $movieTitle } },
                                edge: { year: $year },
                                overwrite: false
                            }
                        }  
                    ) {
                        ${typeActor.plural} {
                            name
                            directedConnection {
                                edges {
                                    year
                                    node {
                                        title
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:DIRECTED {year: $year}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const year = 2010;
            const yearOther = 2011;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                actorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                    `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, year },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    directorsConnection: { edges: [{ year, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, year: yearOther, actorName },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        // create + connect
        test("create-connect *:* - should be length 1 and not overwritten", async () => {
            const source = `
                    mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: $movieTitle
                                    directors: {
                                        connect: {
                                            where: { node: { name: $actorName } },
                                            edge: { year: $year }
                                        }
                                    }
                                }
                            ]
                        ) {
                            ${typeMovie.plural} {
                                title
                                directorsConnection {
                                    edges {
                                        year
                                        node {
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;
            const update = `
                    mutation($movieTitle: String!, $actorName: String!, $year: Int!, $yearOther: Int!) {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                    name: $actorName 
                                    directed: {
                                        connect: {
                                            where: { node: { title: $movieTitle } },
                                            edge: { year: $year },
                                            connect: {
                                                directors: {
                                                    where: { node: { name: $actorName } },
                                                    edge: { year: $yearOther },
                                                    overwrite: false
                                                }
                                            }
                                        }
                                    }
                                }  
                            ]
                        ) {
                            ${typeActor.plural} {
                                name
                                directedConnection {
                                    edges {
                                        year
                                        node {
                                            title
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

            const cypher = `
                        MATCH (m:${typeMovie.name} {title: $movieTitle})
                                <-[:DIRECTED {year: $year}]-
                                    (:${typeActor.name} {name: $actorName})
                        RETURN m
                    `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const actorNameOther = "Actor 2";
            const year = 2010;
            const yearOther = 2011;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                actorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                            CREATE (:${typeActor.name} {name:$actorName})
                        `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, year },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    directorsConnection: { edges: [{ year, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, year, yearOther, actorName: actorNameOther },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("create-connect *:* - should be length 1 and overwritten", async () => {
            const source = `
                    mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: $movieTitle
                                    directors: {
                                        connect: {
                                            where: { node: { name: $actorName } },
                                            edge: { year: $year }
                                        }
                                    }
                                }
                            ]
                        ) {
                            ${typeMovie.plural} {
                                title
                                directorsConnection {
                                    edges {
                                        year
                                        node {
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;
            const update = `
                    mutation($movieTitle: String!, $actorName: String!, $year: Int!, $yearOther: Int!) {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                    name: $actorName 
                                    directed: {
                                        connect: {
                                            where: { node: { title: $movieTitle } },
                                            edge: { year: $year },
                                            connect: {
                                                directors: {
                                                    where: { node: { name: $actorName } },
                                                    edge: { year: $yearOther }
                                                }
                                            }
                                        }
                                    }
                                }  
                            ]
                        ) {
                            ${typeActor.plural} {
                                name
                                directedConnection {
                                    edges {
                                        year
                                        node {
                                            title
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

            const cypher = `
                        MATCH (m:${typeMovie.name} {title: $movieTitle})
                                <-[:DIRECTED {year: $year}]-
                                    (:${typeActor.name} {name: $actorName})
                        RETURN m
                    `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const actorNameOther = "Actor 2";
            const year = 2010;
            const yearOther = 2011;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                actorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                            CREATE (:${typeActor.name} {name:$actorName})
                        `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, year },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    directorsConnection: { edges: [{ year, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, year, yearOther, actorName: actorNameOther },
            });
            // expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            expect(gqlResult2.errors).toBeFalsy();

            // expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, year, actorName: actorNameOther });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                year: yearOther,
                actorName: actorNameOther,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        // nested connect-connect
        test("create-nested connect *:* - should be length 1 and not overwritten", async () => {
            const source = `
                    mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: $movieTitle
                                    directors: {
                                        connect: {
                                            where: { node: { name: $actorName } },
                                            edge: { year: $year }
                                        }
                                    }
                                }
                            ]
                        ) {
                            ${typeMovie.plural} {
                                title
                                directorsConnection {
                                    edges {
                                        year
                                        node {
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;
            const update = `
                mutation($movieOtherTitle: String!, $movieTitle: String!, $year: Int!, $actorName: String!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieOtherTitle,
                                directors: {
                                    connect: [{
                                        where: { node: { name: $actorName  } },
                                        edge: { year: $year },
                                        connect: {
                                            directed: [{
                                                where: { node: { title: $movieTitle  } },
                                                edge: { year: $year },
                                                connect: {
                                                    directors: [{
                                                        where: { node: { name: $actorName  } },
                                                        edge: { year: $year },
                                                        overwrite: false
                                                    }]
                                                }
                                            }]
                                        }
                                    }]
                                }
                            }
                        ]    
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:DIRECTED {year: $year}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const movieOtherTitle = "Movie 2";
            const year = 2010;
            const yearOther = 2011;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                actorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                            CREATE (:${typeActor.name} {name:$actorName})
                        `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, year },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    directorsConnection: { edges: [{ year, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, movieOtherTitle, year: yearOther, actorName },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("create-nested connect *:* - should be length 1 and overwritten", async () => {
            const source = `
                    mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: $movieTitle
                                    directors: {
                                        connect: {
                                            where: { node: { name: $actorName } },
                                            edge: { year: $year }
                                        }
                                    }
                                }
                            ]
                        ) {
                            ${typeMovie.plural} {
                                title
                                directorsConnection {
                                    edges {
                                        year
                                        node {
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;
            const update = `
                    mutation($movieOtherTitle: String!, $movieTitle: String!, $year: Int!, $actorName: String!) {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: $movieOtherTitle,
                                    directors: {
                                        connect: [{
                                            where: { node: { name: $actorName  } },
                                            edge: { year: $year },
                                            connect: {
                                                directed: [{
                                                    where: { node: { title: $movieTitle  } },
                                                    edge: { year: $year },
                                                    connect: {
                                                        directors: [{
                                                            where: { node: { name: $actorName  } },
                                                            edge: { year: $year }
                                                        }]
                                                    }
                                                }]
                                            }
                                        }]
                                    }
                                }
                            ]    
                        ) {
                            ${typeMovie.plural} {
                                title
                                directorsConnection {
                                    edges {
                                        year
                                        node {
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

            const cypher = `
                        MATCH (m:${typeMovie.name} {title: $movieTitle})
                                <-[:DIRECTED {year: $year}]-
                                    (:${typeActor.name} {name: $actorName})
                        RETURN m
                    `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const movieOtherTitle = "Movie 2";
            const year = 2010;
            const yearOther = 2011;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                actorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                            CREATE (:${typeActor.name} {name:$actorName})
                        `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, year },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    directorsConnection: { edges: [{ year, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, movieOtherTitle, year: yearOther, actorName },
            });
            // expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            expect(gqlResult2.errors).toBeFalsy();

            // expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        // update connect-connect
        test("update-nested connect *:* - should be length 1 and not overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                directors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { year: $year }
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($yearOther: Int!, $movieTitle: String!, $year: Int!, $actorName: String!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        connect: {
                            directors: [{
                                where: { node: { name: $actorName  } },
                                edge: { year: $year },
                                connect: {
                                    directed: [{
                                        where: { node: { title: $movieTitle  } },
                                        edge: { year: $yearOther },
                                        overwrite: false
                                    }]
                                }
                            }]
                        }  
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:DIRECTED {year: $year}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const movieOtherTitle = "Movie 2";
            const year = 2010;
            const yearOther = 2011;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                actorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                    `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, year },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    directorsConnection: { edges: [{ year, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, movieOtherTitle, year, yearOther, actorName },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("2update-nested connect *:* - should be length 1 and not overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                directors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { year: $year }
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($yearOther: Int!, $movieTitle: String!, $year: Int!, $actorName: String!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        connect: {
                            directors: [{
                                where: { node: { name: $actorName  } },
                                edge: { year: $year },
                                overwrite: false
                                connect: {
                                    directed: [{
                                        where: { node: { title: $movieTitle  } },
                                        edge: { year: $yearOther },
                                    }]
                                }
                            }]
                        }  
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                    MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:DIRECTED {year: $year}]-
                                (:${typeActor.name} {name: $actorName})
                    RETURN m
                `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const movieOtherTitle = "Movie 2";
            const year = 2010;
            const yearOther = 2011;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                actorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                    `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, year },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    directorsConnection: { edges: [{ year, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, movieOtherTitle, year, yearOther, actorName },
            });
            expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            // expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("update-nested connect *:* - should be length 1 and overwritten", async () => {
            const source = `
                mutation($movieTitle: String!, $actorName: String!, $year: Int!) {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: $movieTitle
                                directors: {
                                    connect: {
                                        where: { node: { name: $actorName } },
                                        edge: { year: $year }
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const update = `
                mutation($yearOther: Int!, $movieTitle: String!, $year: Int!, $actorName: String!) {
                    ${typeMovie.operations.update}(
                        where: {
                            title: $movieTitle
                        },
                        connect: {
                            directors: [{
                                where: { node: { name: $actorName  } },
                                edge: { year: $year },
                                connect: {
                                    directed: [{
                                        where: { node: { title: $movieTitle  } },
                                        edge: { year: $yearOther },
                                    }]
                                }
                            }]
                        }  
                    ) {
                        ${typeMovie.plural} {
                            title
                            directorsConnection {
                                edges {
                                    year
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const cypher = `
                        MATCH (m:${typeMovie.name} {title: $movieTitle})
                                <-[:DIRECTED {year: $year}]-
                                    (:${typeActor.name} {name: $actorName})
                        RETURN m
                    `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const movieOtherTitle = "Movie 2";
            const year = 2010;
            const yearOther = 2011;

            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                actorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                    `,
                { actorName: "Actor 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, year },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.[typeMovie.operations.create][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    directorsConnection: { edges: [{ year, node: { name: actorName } }] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, movieOtherTitle, year, yearOther, actorName },
            });
            // expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            // expect(gqlResult2.errors).toIncludeAllMembers([
            //     "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            // ]);

            expect(gqlResult2.errors).toBeFalsy();

            // expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });
    });

    test.skip("connect via update-connect - 1:1", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                directors: [Actor!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                actors: Actor! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
                directed: [Movie!]! @relationship(type: "DIRECTED", properties: "Directed", direction: OUT)
            }

            interface ActedIn {
                screenTime: Int!
            }
            interface Directed {
                year: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const session = await neo4j.getSession();

        const source = `
            mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                createMovies(
                    input: [
                        {
                            title: $movieTitle
                            actors: {
                                connect: [{
                                    where: { node: { name: $actorName } },
                                    edge: { screenTime: $screenTime },
                                }]
                            }
                        }
                    ]
                ) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                screenTime
                                node {
                                    name
                                }
                            }
                        }
                        directorsConnection {
                            edges {
                                year
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;
        const update = `
            mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!, $year: Int!, $directorName: String!) {
                updateMovies(
                    where: {
                        title: $movieTitle
                    },
                    update: {
                        directors: {
                            connect: {
                                where: { node: { name: $directorName } },
                                edge: { year: $year },
                                overwrite: false
                            }
                        },
                        actors: {
                            connect: {
                                where: { node: { name: $actorName } },
                                edge: { screenTime: $screenTime },
                                overwrite: false
                            }
                        }
                    }
                    
                ) {
                    movies {
                        title
                        directorsConnection {
                            edges {
                                year
                                node {
                                    name
                                }
                            }
                        }
                        actorsConnection {
                            edges {
                                screenTime
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            const cypher = `
            MATCH (m:Movie {title: $movieTitle})
                    <-[:ACTED_IN {screenTime: $screenTime}]-
                        (:Actor {name: $actorName})
            RETURN m
        `;

            const movieTitle = "Movie 1";
            const actorName = "Actor 1";
            const directorName = "Director 1";
            const year = 2010;
            const screenTime = 123;
            const screenTimeUpdate = 134;

            await session.run(`MATCH (n) DETACH DELETE n;`);
            const neo4jInitialResult = await session.run(cypher, {
                movieTitle,
                screenTime,
                actorName,
                directorName,
                year,
            });
            expect(neo4jInitialResult.records).toHaveLength(0);

            await session.run(
                `
                    CREATE (:Actor {name:$actorName})
                    CREATE (:Actor {name:$directorName})
                `,
                { actorName: "Actor 1", directorName: "Director 1" }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, actorName, screenTime },
            });
            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)?.createMovies.movies).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: { edges: [{ screenTime, node: { name: actorName } }] },
                    directorsConnection: { edges: [] },
                },
            ]);

            const gqlResult2 = await graphql({
                schema: await neoSchema.getSchema(),
                source: update,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { movieTitle, directorName, year, actorName, screenTime: screenTimeUpdate },
            });
            // expect(gqlResult2.errors).toBeDefined();
            // TODO: ???
            expect(gqlResult2.errors).toIncludeAllMembers([
                "[[GraphQLError: Movie.actors required exactly once for a specific Actor]]",
            ]);

            expect(gqlResult2.errors).toBeFalsy();

            expect(gqlResult2.data).toBeFalsy();

            const neo4jResultInitial = await session.run(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await session.run(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
            const directorOverwritten = await session.run(
                `MATCH (m:Movie {title: $movieTitle})
                        <-[:DIRECTED {year: $year}]-
                            (d:Actor {name: $directorName})
                RETURN d `,
                { movieTitle, year: 2011, directorName }
            );
            expect(directorOverwritten.records).toHaveLength(0);
        } finally {
            await session.run(`MATCH (n) DETACH DELETE n;`);
            await session.close();
        }
    });
});

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

import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Relationship properties - connect with and without `overwrite` argument", () => {
    const testHelper = new TestHelper();
    let typeDefs: DocumentNode;

    let typeActor: UniqueType;
    let typeMovie: UniqueType;

    afterEach(async () => {
        await testHelper.close();
    });

    describe("Effect on other relationships", () => {
        let movieTitle: string;
        let actorName: string;
        let directorName: string;
        let year: number;
        let screenTime: number;
        let screenTimeUpdate: number;

        beforeEach(async () => {
            typeActor = testHelper.createUniqueType("Actor");
            typeMovie = testHelper.createUniqueType("Movie");

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

                type ActedIn @relationshipProperties {
                    screenTime: Int!
                }
                type Directed @relationshipProperties {
                    year: Int!
                }
            `;
            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            movieTitle = "Movie 1";
            actorName = "Actor 1";
            directorName = "Director 1";
            year = 2010;
            screenTime = 123;
            screenTimeUpdate = 134;

            await testHelper.executeCypher(
                `
                        CREATE (:${typeActor.name} {name:$actorName})
                        CREATE (:${typeActor.name} {name:$directorName})
                    `,
                { actorName: "Actor 1", directorName: "Director 1" }
            );
        });

        test("should return error when overwrite is false, other field does not get updated because of error even if it's first", async () => {
            await testHelper.executeCypher(
                `
                MATCH (actor:${typeActor.name} {name: $actorName})
                MATCH (director:${typeActor.name} {name: $directorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:ACTED_IN { screenTime: $screenTime }]->(m)
                MERGE (director)-[:DIRECTED { year: $year }]->(m)
            `,
                { movieTitle, actorName, directorName, screenTime, year }
            );

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
                                    properties {
                                        year
                                    }
                                    node {
                                        name
                                    }
                                }
                            }
                            actorsConnection {
                                edges {
                                    properties {
                                        screenTime
                                    }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, directorName, year: 2011, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(`${typeMovie.name}.actors required exactly once`);
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
            const directorOverwritten = await testHelper.executeCypher(
                `MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:DIRECTED {year: $year}]-
                                (d:${typeActor.name} {name: $directorName})
                    RETURN d `,
                { movieTitle, year: 2011, directorName }
            );
            expect(directorOverwritten.records).toHaveLength(0);
        });

        test("should return error when overwrite is false, other field does not get connected because of error", async () => {
            await testHelper.executeCypher(
                `
                MATCH (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:ACTED_IN { screenTime: $screenTime }]->(m)
            `,
                { movieTitle, actorName, screenTime }
            );

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
                                    properties {
                                        year
                                    }
                                    node {
                                        name
                                    }
                                }
                            }
                            actorsConnection {
                                edges {
                                    properties {
                                        screenTime
                                    }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, directorName, year, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(`${typeMovie.name}.actors required exactly once`);
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
            const directorOverwritten = await testHelper.executeCypher(
                `MATCH (m:${typeMovie.name} {title: $movieTitle})
                            <-[:DIRECTED {year: $year}]-
                                (d:${typeActor.name} {name: $directorName})
                    RETURN d `,
                { movieTitle, year: 2011, directorName }
            );
            expect(directorOverwritten.records).toHaveLength(0);
        });
    });

    describe("Relationships of type 1:n", () => {
        let movieTitle: string;
        let movieOtherTitle: string;
        let actorName: string;
        let screenTime: number;
        let screenTimeUpdate: number;
        let screenTimeOther: number;

        beforeEach(async () => {
            typeActor = testHelper.createUniqueType("Actor");
            typeMovie = testHelper.createUniqueType("Movie");

            typeDefs = gql`
                type ${typeMovie.name} {
                    title: String!
                    actors: ${typeActor.name}! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                }

                type ${typeActor.name} {
                    name: String!
                    movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
                }

                type ActedIn @relationshipProperties {
                    screenTime: Int!
                }
            `;
            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            movieTitle = "Movie 1";
            movieOtherTitle = "Movie 2";
            actorName = "Actor 1";
            screenTime = 123;
            screenTimeUpdate = 134;
            screenTimeOther = 156;
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:ACTED_IN { screenTime: $screenTime }]->(m)
            `,
                { movieTitle, actorName, screenTime }
            );
        });

        // update + update + connect
        test("should overwrite existing relationship with new properties: connect in nested update", async () => {
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
                                    properties {
                                        screenTime
                                    }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResultUpdate.errors).toBeFalsy();
            expect((gqlResultUpdate.data as any)?.[typeMovie.operations.update][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        edges: [{ properties: { screenTime: screenTimeUpdate }, node: { name: actorName } }],
                    },
                },
            ]);

            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
            const neo4jResult = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResult.records).toHaveLength(1);
        });

        test("should return error because overwrite set to false: connect in nested update", async () => {
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
                                   properties {
                                     screenTime
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(`${typeMovie.name}.actors required exactly once`);
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        // update + connect
        test("should return error because overwrite set to false, when relationship field has cardinality 1: connect in update", async () => {
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
                                   properties {
                                     screenTime
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(`${typeMovie.name}.actors required exactly once`);
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("should overwrite existing relationship with new properties when relationship field has cardinality 1: connect in update", async () => {
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
                                   properties {
                                     screenTime
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResultUpdate.errors).toBeFalsy();
            expect((gqlResultUpdate.data as any)?.[typeMovie.operations.update][typeMovie.plural]).toEqual([
                {
                    title: movieTitle,
                    actorsConnection: {
                        edges: [{ properties: { screenTime: screenTimeUpdate }, node: { name: actorName } }],
                    },
                },
            ]);

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        test("should return error because overwrite set to false, when relationship field has cardinality n: connect in update", async () => {
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
                                   properties {
                                     screenTime
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(
                `${typeActor.name}.movies required exactly once for a specific ${typeMovie.name}`
            );
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("should overwrite existing relationship with new properties when relationship field has cardinality n: connect in update", async () => {
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
                                   properties {
                                     screenTime
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResultUpdate.errors).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        // create + connect
        test("should return error because overwrite set to false: connect in create", async () => {
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
                                   properties {
                                     screenTime
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(`${typeMovie.name}.actors required exactly once`);
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        // nested connect-connect
        test("should return error because overwrite set to false, when relationship field has cardinality n: nested connect in create", async () => {
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
                                   properties {
                                     screenTime
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, movieOtherTitle },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(
                `${typeActor.name}.movies required exactly once for a specific ${typeMovie.name}`
            );
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("should overwrite existing relationship with new properties, when relationship field has cardinality n: nested connect in create", async () => {
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
                                   properties {
                                     screenTime
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, movieOtherTitle },
            });
            expect(gqlResultUpdate.errors).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        test("should overwrite existing relationship with new properties when relationship field has cardinality 1: nested connect in create", async () => {
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
                                   properties {
                                     screenTime
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, movieOtherTitle },
            });
            expect(gqlResultUpdate.errors).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        test("should return error because overwrite set to false, when relationship field has cardinality 1: nested connect in create", async () => {
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
                               properties {
                                 screenTime
                               }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, movieOtherTitle },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(`${typeMovie.name}.actors required exactly once`);
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        // update connect-connect
        test("should overwrite existing relationship with new properties: nested connect in nested update", async () => {
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
                                   properties {
                                     screenTime
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, screenTimeOther },
            });
            expect(gqlResultUpdate.errors).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwrittenOnce = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwrittenOnce.records).toHaveLength(0);
            const neo4jResultOverwrittenTwice = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeOther,
                actorName,
            });
            expect(neo4jResultOverwrittenTwice.records).toHaveLength(1);
        });

        test("should return error because overwrite set to false: nested connect in nested update", async () => {
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
                                   properties {
                                     screenTime
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, screenTimeOther },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(
                `${typeActor.name}.movies required exactly once for a specific ${typeMovie.name}`
            );
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwrittenOnce = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
            });
            expect(neo4jResultOverwrittenOnce.records).toHaveLength(0);
            const neo4jResultOverwrittenTwice = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeOther,
                actorName,
            });
            expect(neo4jResultOverwrittenTwice.records).toHaveLength(0);
        });

        // update - create - connect
        test("should return error because overwrite set to false: update-create-nested connect", async () => {
            const update = `
                mutation($screenTimeOther: Int!, $movieTitle: String!, $movieOtherTitle: String!, $screenTime: Int!, $actorName: String!) {
                    ${typeActor.operations.update}(
                        where: {
                            name: $actorName
                        },
                        create: {
                            movies: [
                                {
                                    edge: { screenTime: $screenTime },
                                    node: {
                                        title: $movieOtherTitle
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
                                   properties {
                                     screenTime
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: {
                    movieTitle,
                    actorName,
                    screenTime: screenTimeUpdate,
                    screenTimeOther,
                    movieOtherTitle,
                },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(
                `${typeActor.name}.movies required exactly once for a specific ${typeMovie.name}`
            );
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });
    });

    describe("Relationships type 1:n with @unique", () => {
        let movieTitle: string;
        let actorName: string;
        let screenTime: number;
        let screenTimeUpdate: number;

        beforeEach(async () => {
            typeActor = testHelper.createUniqueType("Actor");
            typeMovie = testHelper.createUniqueType("Movie");

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
        
                        type ActedIn @relationshipProperties {
                            screenTime: Int!
                        }
                    `;
            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            movieTitle = "Movie 1";
            actorName = "Actor 1";
            screenTime = 123;
            screenTimeUpdate = 134;
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:ACTED_IN { screenTime: $screenTime }]->(m)
            `,
                { movieTitle, actorName, screenTime }
            );
        });

        // update + update + connectOrCreate
        test("update with connectOrCreate is a no-op when relationship field has cardinality 1, overwrite not an option", async () => {
            const actorId = 1;

            await testHelper.executeCypher(
                `
                        MATCH (actor:${typeActor.name} {name: $actorName})
                        SET actor.id=$actorId
                    `,
                { actorName, actorId }
            );
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
                                           properties {
                                             screenTime
                                           }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, actorName, screenTime: screenTimeUpdate, actorId },
            });
            expect(gqlResultUpdate.errors).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime,
                actorName,
                actorId,
            });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                screenTime: screenTimeUpdate,
                actorName,
                actorId,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });
    });

    describe("Relationships of type n:n", () => {
        let movieTitle: string;
        let movieOtherTitle: string;
        let actorName: string;
        let actorNameOther: string;
        let year: number;
        let yearOther: number;

        beforeEach(async () => {
            typeActor = testHelper.createUniqueType("Actor");
            typeMovie = testHelper.createUniqueType("Movie");

            typeDefs = gql`
                type ${typeMovie.name} {
                    title: String!
                    directors: [${typeActor.name}!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                }

                type ${typeActor.name} {
                    name: String!
                    directed: [${typeMovie.name}!]! @relationship(type: "DIRECTED", properties: "Directed", direction: OUT)
                }

                type Directed @relationshipProperties {
                    year: Int!
                }
            `;
            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            movieTitle = "Movie 1";
            movieOtherTitle = "Movie 2";
            actorName = "Actor 1";
            actorNameOther = "Actor 2";
            year = 2010;
            yearOther = 2011;
        });

        // update + update + connect
        test("should return error because overwrite set to false", async () => {
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:DIRECTED { year: $year }]->(m)
            `,
                { movieTitle, actorName, year }
            );
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
                                    properties {
                                        year
                                    }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, year: yearOther, actorName },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(
                `${typeMovie.name}.directors required exactly once for a specific ${typeActor.name}`
            );
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("should overwrite existing relationship with new properties", async () => {
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:DIRECTED { year: $year }]->(m)
            `,
                { movieTitle, actorName, year }
            );
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
                                    properties {
                                        year
                                    }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, year: yearOther, actorName },
            });
            expect(gqlResultUpdate.errors).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        // update + connect
        test("should overwrite existing relationship with new properties: connect in update", async () => {
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:DIRECTED { year: $year }]->(m)
            `,
                { movieTitle, actorName, year }
            );
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
                                    properties {
                                        year
                                    }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, year: yearOther, actorName },
            });
            expect(gqlResultUpdate.errors).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        test("should return error because overwrite set to false: connect in update", async () => {
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:DIRECTED { year: $year }]->(m)
            `,
                { movieTitle, actorName, year }
            );
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
                                    properties {
                                        year
                                    }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, year: yearOther, actorName },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(
                `${typeActor.name}.directed required exactly once for a specific ${typeMovie.name}`
            );
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        // create + connect
        test("should return error because overwrite set to false: connect in create", async () => {
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:DIRECTED { year: $year }]->(m)
            `,
                { movieTitle, actorName, year }
            );
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
                                       properties {
                                         year
                                       }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, year, yearOther, actorName: actorNameOther },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(
                `${typeMovie.name}.directors required exactly once for a specific ${typeActor.name}`
            );
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("should overwrite existing relationship with new properties: connect in create", async () => {
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:DIRECTED { year: $year }]->(m)
            `,
                { movieTitle, actorName, year }
            );
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
                                       properties {
                                         year
                                       }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, year, yearOther, actorName: actorNameOther },
            });
            expect(gqlResultUpdate.errors).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, {
                movieTitle,
                year,
                actorName: actorNameOther,
            });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                year: yearOther,
                actorName: actorNameOther,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        // nested connect-connect
        test("should return error because overwrite set to false: nested connect in create", async () => {
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:DIRECTED { year: $year }]->(m)
            `,
                { movieTitle, actorName, year }
            );
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
                                   properties {
                                     year
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, movieOtherTitle, year: yearOther, actorName },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(
                `${typeMovie.name}.directors required exactly once for a specific ${typeActor.name}`
            );
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("should overwrite existing relationship with new properties: nested connect in create", async () => {
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:DIRECTED { year: $year }]->(m)
            `,
                { movieTitle, actorName, year }
            );
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
                                       properties {
                                         year
                                       }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, movieOtherTitle, year: yearOther, actorName },
            });
            expect(gqlResultUpdate.errors).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });

        // update connect-connect
        test("should return error because overwrite set to false on last level: nested connect in update", async () => {
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:DIRECTED { year: $year }]->(m)
            `,
                { movieTitle, actorName, year }
            );
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
                                   properties {
                                     year
                                   }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, movieOtherTitle, year, yearOther, actorName },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(
                `${typeActor.name}.directed required exactly once for a specific ${typeMovie.name}`
            );
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("should return error because overwrite set to false on inner level: nested connect in update", async () => {
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:DIRECTED { year: $year }]->(m)
            `,
                { movieTitle, actorName, year }
            );
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
                                    properties {
                                        year
                                    }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, movieOtherTitle, year, yearOther, actorName },
            });
            expect(gqlResultUpdate.errors?.[0]?.toString()).toInclude(
                `${typeMovie.name}.directors required exactly once for a specific ${typeActor.name}`
            );
            expect(gqlResultUpdate.data).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(1);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(0);
        });

        test("should overwrite existing relationship with new properties: nested connect in update", async () => {
            await testHelper.executeCypher(
                `
                CREATE (actor:${typeActor.name} {name: $actorName})
                CREATE (m:${typeMovie.name} { title: $movieTitle })
                MERGE (actor)-[:DIRECTED { year: $year }]->(m)
            `,
                { movieTitle, actorName, year }
            );
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
                                    properties {
                                        year
                                    }
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

            const gqlResultUpdate = await testHelper.executeGraphQL(update, {
                variableValues: { movieTitle, movieOtherTitle, year, yearOther, actorName },
            });
            expect(gqlResultUpdate.errors).toBeFalsy();

            const neo4jResultInitial = await testHelper.executeCypher(cypher, { movieTitle, year, actorName });
            expect(neo4jResultInitial.records).toHaveLength(0);
            const neo4jResultOverwritten = await testHelper.executeCypher(cypher, {
                movieTitle,
                year: yearOther,
                actorName,
            });
            expect(neo4jResultOverwritten.records).toHaveLength(1);
        });
    });
});

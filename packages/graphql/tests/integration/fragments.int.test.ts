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

import type { Driver } from "neo4j-driver";
import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import { faker } from "@faker-js/faker";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { getQuerySource } from "../utils/get-query-source";

const testLabel = generate({ charset: "alphabetic" });

describe("fragments", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let schema: GraphQLSchema;

    const typeDefs = gql`
        interface Production {
            title: String!
            runtime: Int!
        }

        type Movie implements Production {
            title: String!
            runtime: Int!
        }

        type Series implements Production {
            title: String!
            runtime: Int!
            episodes: Int!
        }

        interface ActedIn @relationshipProperties {
            screenTime: Int!
        }

        interface InterfaceA {
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }

        type Actor implements InterfaceA {
            name: String!
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }
    `;

    const actorName = generate({
        readable: true,
        charset: "alphabetic",
    });

    const movieTitle = generate({
        readable: true,
        charset: "alphabetic",
    });
    const movieRuntime = faker.datatype.number();
    const movieScreenTime = faker.datatype.number();

    const seriesTitle = generate({
        readable: true,
        charset: "alphabetic",
    });
    const seriesRuntime = faker.datatype.number();
    const seriesEpisodes = faker.datatype.number();
    const seriesScreenTime = faker.datatype.number();

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        schema = await neoSchema.getSchema();

        await session.run(
            `
            CREATE (a:Actor:${testLabel} { name: $actorName })
            CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie:${testLabel} { title: $movieTitle, runtime:$movieRuntime })
            CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series:${testLabel} { title: $seriesTitle, runtime:$seriesRuntime, episodes: $seriesEpisodes })
        `,
            {
                actorName,
                movieTitle,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesRuntime,
                seriesEpisodes,
                seriesScreenTime,
            }
        );
        await session.close();
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await session.run(`MATCH (node:${testLabel}) DETACH DELETE node`);
        await driver.close();
    });

    test("should be able project fragment on type", async () => {
        const query = gql`
            query ($actorName: String!) {
                actors(where: { name: $actorName }) {
                    ...FragmentOnType
                }
            }

            fragment FragmentOnType on Actor {
                name
            }
        `;
        const graphqlResult = await graphql({
            schema,
            source: getQuerySource(query),
            contextValue: neo4j.getContextValues(),
            variableValues: { actorName },
        });

        expect(graphqlResult.errors).toBeFalsy();

        const graphqlActor: Array<{ name: string }> = (graphqlResult.data as any)?.actors;

        expect(graphqlActor).toHaveLength(1);
        expect(graphqlActor[0]?.name).toBe(actorName);
    });

    test("should be able project fragment on interface", async () => {
        const query = gql`
            query ($actorName: String!) {
                actors(where: { name: $actorName }) {
                    name
                    actedIn {
                        ...FragmentOnInterface
                    }
                }
            }

            fragment FragmentOnInterface on Production {
                title
            }
        `;

        const graphqlResult = await graphql({
            schema,
            source: getQuerySource(query),
            contextValue: neo4j.getContextValues(),
            variableValues: { actorName },
        });

        expect(graphqlResult.errors).toBeFalsy();

        const graphqlActors: Array<{ name: string; actedIn: Array<{ title: string }> }> = (graphqlResult.data as any)
            ?.actors;

        expect(graphqlActors).toHaveLength(1);
        expect(graphqlActors[0]?.name).toBe(actorName);
        expect(graphqlActors[0]?.actedIn).toEqual(
            expect.toIncludeSameMembers([{ title: movieTitle }, { title: seriesTitle }])
        );
    });

    test("should be able to project nested fragments", async () => {
        const query = gql`
            query ($actorName: String!) {
                actors(where: { name: $actorName }) {
                    name
                    actedIn {
                        ...FragmentA
                    }
                    ...FragmentB
                }
            }

            fragment FragmentA on Production {
                title
            }

            fragment FragmentB on InterfaceA {
                actedIn {
                    runtime
                }
            }
        `;

        const graphqlResult = await graphql({
            schema,
            source: getQuerySource(query),
            contextValue: neo4j.getContextValues(),
            variableValues: { actorName },
        });

        expect(graphqlResult.errors).toBeFalsy();

        const graphqlActors: Array<{ name: string; actedIn: Array<{ title: string; runtime: number }> }> = (
            graphqlResult.data as any
        )?.actors;

        expect(graphqlActors).toHaveLength(1);
        expect(graphqlActors[0]?.name).toBe(actorName);
        expect(graphqlActors[0]?.actedIn).toEqual(
            expect.toIncludeSameMembers([
                { title: movieTitle, runtime: movieRuntime },
                { title: seriesTitle, runtime: seriesRuntime },
            ])
        );
    });
});

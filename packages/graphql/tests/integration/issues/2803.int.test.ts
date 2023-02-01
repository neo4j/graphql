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
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2803", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Movie: UniqueType;
    let Actor: UniqueType;

    const actorInput1 = {
        name: "some name",
    };
    const actorInput2 = {
        name: "some-other-name",
    };
    const actorInput3 = {
        name: "ThirdName",
    };
    const movieInput1 = {
        released: 1,
    };
    const movieInput2 = {
        released: 987598257,
    };

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Movie = new UniqueType("Movie");
        Actor = new UniqueType("Actor");

        const typeDefs = `
            type ${Movie} {
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                released: Int!
            }

            type ${Actor} {
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                name: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        await session.run(
            `
            CREATE (a1:${Actor})-[:ACTED_IN]->(m1:${Movie})
            CREATE (a1)-[:ACTED_IN]->(m2:${Movie})
            CREATE (a2:${Actor})-[:ACTED_IN]->(m2)
            CREATE (a3:${Actor})
            SET a1 = $actorInput1, a2 = $actorInput2, a3 = $actorInput3,
                m1 = $movieInput1, m2 = $movieInput2
        `,
            { actorInput1, actorInput2, actorInput3, movieInput1, movieInput2 }
        );
    });

    afterEach(async () => {
        await cleanNodes(session, [Movie, Actor]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should find movies aggregate within double nested relationships", async () => {
        const query = `
            {
                ${Actor.plural}(where: { movies_SOME: { actors_ALL: { moviesAggregate: { count_GT: 1 } } } }) {
                    name
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput1]),
        });
    });

    test("should find aggregations at all levels within double nested relationships", async () => {
        const queryExpectingResults = `
            {
                ${Actor.plural}(
                    where: {
                        movies_SOME: { actors_ALL: { moviesAggregate: { count_GT: 1 } }, actorsAggregate: { count: 1 } }
                    }
                ) {
                    name
                }
            }
        `;
        const queryExpectingNoResults = `
            {
                ${Actor.plural}(
                    where: {
                        movies_SOME: { actors_ALL: { moviesAggregate: { count_GT: 1 } }, actorsAggregate: { count: 0 } }
                    }
                ) {
                    name
                }
            }
        `;

        const resultExpectingResults = await graphql({
            schema: await neoSchema.getSchema(),
            source: queryExpectingResults,
            contextValue: neo4j.getContextValues(),
        });
        const resultExpectingNoResults = await graphql({
            schema: await neoSchema.getSchema(),
            source: queryExpectingNoResults,
            contextValue: neo4j.getContextValues(),
        });

        expect(resultExpectingResults.errors).toBeFalsy();
        expect(resultExpectingResults.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput1]),
        });
        expect(resultExpectingNoResults.errors).toBeFalsy();
        expect(resultExpectingNoResults.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([]),
        });
    });

    test("should find movies aggregate within triple nested relationships", async () => {
        const query = `
            {
                ${Movie.plural}(where: { actors_SOME: { movies_SOME: { actors_ALL: { moviesAggregate: { count_GT: 1 } } } } }) {
                    released
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([movieInput1, movieInput2]),
        });
    });
});

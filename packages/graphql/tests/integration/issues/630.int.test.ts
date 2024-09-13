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

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/630", () => {
    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    const testHelper = new TestHelper();

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");

        const typeDefs = `
         type ${typeActor} {
             id: ID!
             name: String!
             movies: [${typeMovie}!]! @cypher(statement: "MATCH (this)-[:ACTED_IN]->(m:${typeMovie}) RETURN m", columnName:"m")
         }
 
         type ${typeMovie} {
             id: ID!
             title: String!
             actors: [${typeActor}!]! @relationship(type: "ACTED_IN", direction: IN)
         }
     `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should query nested connection", async () => {
        const testLabel = generate({ charset: "alphabetic" });

        const actors = [
            {
                id: generate(),
                name: "Keanu Reeves",
            },
            {
                id: generate(),
                name: "Carrie-Ann Moss",
            },
        ];

        const movie = {
            id: generate(),
            title: "The Matrix",
        };

        await testHelper.executeCypher(
            `
            CREATE (movie:${typeMovie}:${testLabel}) SET movie = $movie
            CREATE (actor1:${typeActor}:${testLabel}) SET actor1 = $actors[0]
            CREATE (actor2:${typeActor}:${testLabel}) SET actor2 = $actors[1]
            MERGE (actor1)-[:ACTED_IN]->(movie)<-[:ACTED_IN]-(actor2)
        `,
            { actors, movie }
        );

        const source = `
            query($actorId: ID!) {
                ${typeActor.plural}(where: { id: $actorId }) {
                    id
                    name
                    movies {
                        id
                        title
                        actorsConnection {
                            totalCount
                            edges {
                                node {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(source, {
            variableValues: { actorId: actors[0]?.id },
        });

        expect(gqlResult.errors).toBeUndefined();

        const gqlActor = (gqlResult.data as any)[typeActor.plural][0];

        expect(gqlActor).toBeDefined();
        expect(gqlActor).toEqual({
            ...actors[0],
            movies: [
                {
                    ...movie,
                    actorsConnection: {
                        totalCount: 2,
                        edges: expect.toIncludeSameMembers([
                            {
                                node: actors[0],
                            },
                            {
                                node: actors[1],
                            },
                        ]),
                    },
                },
            ],
        });
    });
});

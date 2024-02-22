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
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/2697", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let session: Session;
    let typeDefs: string;

    const typeMovie = new UniqueType("Movie");
    const typeActor = new UniqueType("Actor");

    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        typeDefs = `
        type ${typeMovie.name} {
            title: String
            duration: Duration
            actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
        }

        type ${typeActor.name} {
            name: String
            movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }

        type ActedIn @relationshipProperties {
            screenTime: Duration
        }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
        session = await neo4j.getSession();
        await session.run(`
            CREATE (t1:${typeMovie.name} { title: "Terminator 1", duration: duration("PT1H47M") }),
            (t2:${typeMovie.name} { title: "Terminator 2", duration: duration("PT2H15M") }),
            (arnold:${typeActor.name} { name: "Arnold"}),
            (linda:${typeActor.name} { name: "Linda"}),
            (arnold)-[:ACTED_IN { screenTime: duration("PT1H20M") }]->(t1),
            (arnold)-[:ACTED_IN { screenTime: duration("PT2H01M") }]->(t2),
            (linda)-[:ACTED_IN { screenTime: duration("PT30M") }]->(t1),
            (linda)-[:ACTED_IN { screenTime: duration("PT20M") }]->(t2)
            `);
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    test("Aggregate on node duration", async () => {
        const query = `
            query {
                ${typeActor.plural}(where: { moviesAggregate: { node: {duration_AVERAGE_GT: "PT1H" } } } ) {
                    name
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.plural]).toEqual([
            {
                name: "Arnold",
            },
            {
                name: "Linda",
            },
        ]);
    });

    test("Aggregate on edge duration", async () => {
        const query = `
            query {
                ${typeActor.plural}(where: { moviesAggregate: { edge: {screenTime_AVERAGE_GT: "PT1H" } } } ) {
                    name
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeActor.plural]).toEqual([
            {
                name: "Arnold",
            },
        ]);
    });
});

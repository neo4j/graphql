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

describe("https://github.com/neo4j/graphql/issues/2766", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Movie = new UniqueType("Movie");
        Actor = new UniqueType("Actor");

        const typeDefs = `
            type ${Actor} {
                name: String!
                movies(title: String): [${Movie}]
                    @cypher(
                        statement: """
                        MATCH (this)-[]-(m:${Movie} {title: $title})
                        RETURN m
                        """,
                        columnName: "m"
                    )
            }

            type ${Movie} {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        await session.run(`
                CREATE (a:${Actor} {name: "arthur"})-[:ACTED_IN]->(:${Movie} { title: "some title"})
                CREATE (a)-[:ACTED_IN]->(:${Movie} { title: "another title"})
        `);
    });

    afterEach(async () => {
        await cleanNodes(session, [Movie, Actor]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not find genresConnection_ALL where NONE true", async () => {
        const query = `
            {
                ${Actor.plural} {
                    name
                    movies(title: "some title") {
                        title
                        actors {
                            name
                            movies(title: "another title") {
                                title
                            }
                        }
                    }
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
            [Actor.plural]: [
                {
                    name: "arthur",
                    movies: [
                        {
                            title: "some title",
                            actors: [
                                {
                                    name: "arthur",
                                    movies: [
                                        {
                                            title: "another title",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });
});

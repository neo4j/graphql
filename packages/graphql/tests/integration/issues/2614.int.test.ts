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
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2614", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Actor: UniqueType;
    let Movie: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Actor = generateUniqueType("Actor");
        Movie = generateUniqueType("Movie");

        const typeDefs = `
            interface Production {
                title: String!
                actors: [${Actor}!]!
            }
            
            type ${Movie} implements Production @node(label:"Film"){
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                runtime: Int!
            }
            
            type Series implements Production {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                episodes: Int!
            }
            
            interface ActedIn @relationshipProperties {
                role: String!
            }
            
            type ${Actor} {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        await session.run(`
            CREATE (a:${Actor} { name: "Jack Adams" })-[:ACTED_IN]->(m1:Film { title: "The Movie we want", runtime: 123 })
            CREATE (a)-[:ACTED_IN]->(m2:${Movie} { title: "The Movie we do not want", runtime: 234 })
        `);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [Actor, Movie]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should use the provided node directive label in the where clause", async () => {
        const query = `
            query GetProductionsMovie {
                ${Actor.plural} {
                    name
                    actedIn(where: { _on: { ${Movie.name}: {} } }) {
                        title
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
        expect(result.data as any).toEqual({
            [Actor.plural]: [
                {
                    name: "Jack Adams",
                    actedIn: [
                        {
                            title: "The Movie we want",
                        },
                    ],
                },
            ],
        });
    });
});

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

describe("https://github.com/neo4j/graphql/issues/2267", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Place: UniqueType;
    let Post: UniqueType;
    let Story: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        Place = new UniqueType("Place");
        Post = new UniqueType("Post");
        Story = new UniqueType("Story");

        session = await neo4j.getSession();

        const typeDefs = `
            type ${Place} {
                displayName: String!
                activity: [Publication!]! @relationship(type: "ACTIVITY", direction: IN)
            }

            interface Publication {
                name: String
                activity: [${Place}!]! @relationship(type: "ACTIVITY", direction: OUT)
            }

            type ${Post} implements Publication {
                name: String
                activity: [${Place}!]!
            }

            type ${Story} implements Publication {
                name: String
                activity: [${Place}!]!
            }
        `;

        await session.run(`
        CREATE(:${Place} {displayName: "786 aa"})<-[:ACTIVITY]-(:${Post} {name: "A post"})
        CREATE(:${Place} {displayName: "8 à Huita"})
        CREATE(:${Place} {displayName: "9ème Sauvagea"})<-[:ACTIVITY]-(:${Story} {name: "A story"})
        CREATE(:${Place} {displayName: "A One Shopa"})
        CREATE(:${Place} {displayName: "zaza"})<-[:ACTIVITY]-(:${Post} {name: "Another post"})
        `);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [Place, Post, Story]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should correctly order when requesting only top-level fields", async () => {
        const query = `
        query {
            ${Place.plural}(options: {sort: {displayName: ASC}}) {
              displayName
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
            [Place.plural]: [
                {
                    displayName: "786 aa",
                },
                {
                    displayName: "8 à Huita",
                },
                {
                    displayName: "9ème Sauvagea",
                },
                {
                    displayName: "A One Shopa",
                },
                {
                    displayName: "zaza",
                },
            ],
        });
    });

    test("should correctly order when requesting nested interface level fields", async () => {
        const query = `
        query {
            ${Place.plural}(options: {sort: {displayName: ASC}}) {
              displayName
              activity{
                name
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
            [Place.plural]: [
                {
                    displayName: "786 aa",
                    activity: [
                        {
                            name: "A post",
                        },
                    ],
                },
                {
                    displayName: "8 à Huita",
                    activity: [],
                },
                {
                    displayName: "9ème Sauvagea",
                    activity: [
                        {
                            name: "A story",
                        },
                    ],
                },
                {
                    displayName: "A One Shopa",
                    activity: [],
                },
                {
                    displayName: "zaza",
                    activity: [
                        {
                            name: "Another post",
                        },
                    ],
                },
            ],
        });
    });
});

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

import { gql } from "apollo-server";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { TestSubscriptionsPlugin } from "../../utils/TestSubscriptionPlugin";
import Neo4j from "../neo4j";

describe("array-subscription", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;
    let plugin: TestSubscriptionsPlugin;

    let typeActor: UniqueType;
    let typeMovie: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        typeActor = new UniqueType("Actor");
        typeMovie = new UniqueType("Movie");

        plugin = new TestSubscriptionsPlugin();
        const typeDefs = gql`
            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${typeMovie.name} {
                id: ID!
                name: String
                tagline: String
                tags: [String]
                moreTags: [String]
                length: Int
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                subscriptions: plugin,
            },
        });
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("push", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.update}(where: { id: "1" }, update: { tags_PUSH: "a tag" }) {
                ${typeMovie.plural} {
                    id
                }
            }
        }
        `;

        await session.run(`
            CREATE (:${typeMovie.name} { id: "1", name: "Terminator", tags: [] })
            CREATE (:${typeMovie.name} { id: "2", name: "The Many Adventures of Winnie the Pooh" })
        `);

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeUndefined();

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(Number),
                timestamp: expect.any(Number),
                event: "update",
                properties: {
                    old: { id: "1", name: "Terminator", tags: [] },
                    new: { id: "1", name: "Terminator", tags: ["a tag"] },
                },
                typename: typeMovie.name,
            },
        ]);
    });

    test("pop", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.update}(where: { id: "1" }, update: { tags_POP: 1 }) {
                ${typeMovie.plural} {
                    id
                }
            }
        }
        `;

        await session.run(`
            CREATE (:${typeMovie.name} { id: "1", name: "Terminator", tags: ["a tag"] })
            CREATE (:${typeMovie.name} { id: "2", name: "The Many Adventures of Winnie the Pooh" })
        `);

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeUndefined();

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(Number),
                timestamp: expect.any(Number),
                event: "update",
                properties: {
                    old: { id: "1", name: "Terminator", tags: ["a tag"] },
                    new: { id: "1", name: "Terminator", tags: [] },
                },
                typename: typeMovie.name,
            },
        ]);
    });

    test("pop and push", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.update}(where: { id: "1" }, update: { tags_POP: 1, moreTags_PUSH: ["a new tag"] }) {
                ${typeMovie.plural} {
                    id
                }
            }
        }
        `;

        await session.run(`
            CREATE (:${typeMovie.name} { id: "1", name: "Terminator", tags: ["a tag"], moreTags: [] })
            CREATE (:${typeMovie.name} { id: "2", name: "The Many Adventures of Winnie the Pooh" })
        `);

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeUndefined();

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(Number),
                timestamp: expect.any(Number),
                event: "update",
                properties: {
                    old: { id: "1", name: "Terminator", tags: ["a tag"], moreTags: [] },
                    new: { id: "1", name: "Terminator", tags: [], moreTags: ["a new tag"] },
                },
                typename: typeMovie.name,
            },
        ]);
    });
});

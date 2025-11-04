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

import { gql } from "graphql-tag";
import { TestSubscriptionsEngine } from "../../utils/TestSubscriptionsEngine";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("array-subscription", () => {
    const testHelper = new TestHelper();
    let plugin: TestSubscriptionsEngine;

    let typeActor: UniqueType;
    let typeMovie: UniqueType;

    beforeEach(async () => {
        typeActor = testHelper.createUniqueType("Actor");
        typeMovie = testHelper.createUniqueType("Movie");

        plugin = new TestSubscriptionsEngine();
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
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

        await testHelper.executeCypher(`
            CREATE (:${typeMovie.name} { id: "1", name: "Terminator", tags: [] })
            CREATE (:${typeMovie.name} { id: "2", name: "The Many Adventures of Winnie the Pooh" })
        `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(String),
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

        await testHelper.executeCypher(`
            CREATE (:${typeMovie.name} { id: "1", name: "Terminator", tags: ["a tag"] })
            CREATE (:${typeMovie.name} { id: "2", name: "The Many Adventures of Winnie the Pooh" })
        `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(String),
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

        await testHelper.executeCypher(`
            CREATE (:${typeMovie.name} { id: "1", name: "Terminator", tags: ["a tag"], moreTags: [] })
            CREATE (:${typeMovie.name} { id: "2", name: "The Many Adventures of Winnie the Pooh" })
        `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(String),
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

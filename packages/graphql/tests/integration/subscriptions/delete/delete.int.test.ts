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
import { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../../src";
import { generateUniqueType, UniqueType } from "../../../utils/graphql-types";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import neo4j from "../../neo4j";

describe("Subscriptions delete", () => {
    let driver: Driver;
    let session: Session;
    let neoSchema: Neo4jGraphQL;
    let plugin: TestSubscriptionsPlugin;

    let typeActor: UniqueType;
    let typeMovie: UniqueType;

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(() => {
        session = driver.session();

        typeActor = generateUniqueType("Actor");
        typeMovie = generateUniqueType("Movie");

        plugin = new TestSubscriptionsPlugin();
        const typeDefs = gql`
            type ${typeActor.name} {
                id: ID!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${typeMovie.name} {
                id: ID!
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

    test("simple delete with subscriptions enabled", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.delete} {
                nodesDeleted
            }
        }
        `;

        await session.run(`
            CREATE (:${typeMovie.name} { id: "1" })
            CREATE (:${typeMovie.name} { id: "2" })
        `);

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: { driver },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.operations.delete].nodesDeleted).toBe(2);

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(Number),
                timestamp: expect.any(Number),
                event: "delete",
                properties: { old: { id: "1" }, new: undefined },
                typename: typeMovie.name,
            },
            {
                id: expect.any(Number),
                timestamp: expect.any(Number),
                event: "delete",
                properties: { old: { id: "2" }, new: undefined },
                typename: typeMovie.name,
            },
        ]);
    });

    test("simple nested delete with subscriptions enabled", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.delete}(delete: { actors: { where: { } } }) {
                nodesDeleted
            }
        }
        `;

        await session.run(`
            CREATE (m1:${typeMovie.name} { id: "1" })<-[:ACTED_IN]-(:${typeActor.name} { id: "3" })
            CREATE (m2:${typeMovie.name} { id: "2" })<-[:ACTED_IN]-(:${typeActor.name} { id: "4" })
            CREATE (m2)<-[:ACTED_IN]-(:${typeActor.name} { id: "5" })
        `);

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: { driver },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.operations.delete].nodesDeleted).toBe(5);

        expect(plugin.eventList).toHaveLength(5);
        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: { old: { id: "1" }, new: undefined },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: { old: { id: "3" }, new: undefined },
                    typename: typeActor.name,
                },
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: { old: { id: "2" }, new: undefined },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: { old: { id: "5" }, new: undefined },
                    typename: typeActor.name,
                },
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: { old: { id: "4" }, new: undefined },
                    typename: typeActor.name,
                },
            ])
        );
    });

    test("triple nested delete with subscriptions enabled", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.delete}(
                where: { id: 1 }
                delete: {
                    actors: {
                        where: { node: { id: 3 } }
                        delete: {
                            movies: {
                                where: { node: { id: 2 } }
                                delete: { actors: { where: { node: { id: 4 } } } }
                            }
                        }
                    }
                }
            ) {
                nodesDeleted
            }
        }
        `;

        await session.run(`
            CREATE (m1:${typeMovie.name} { id: "1" })<-[:ACTED_IN]-(a:${typeActor.name} { id: "3" })
            CREATE (m2:${typeMovie.name} { id: "2" })<-[:ACTED_IN]-(:${typeActor.name} { id: "4" })
            CREATE (m2)<-[:ACTED_IN]-(a)
        `);

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: { driver },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.operations.delete].nodesDeleted).toBe(4);

        expect(plugin.eventList).toHaveLength(4);
        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: { old: { id: "1" }, new: undefined },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: { old: { id: "3" }, new: undefined },
                    typename: typeActor.name,
                },
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: { old: { id: "2" }, new: undefined },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: { old: { id: "4" }, new: undefined },
                    typename: typeActor.name,
                },
            ])
        );
    });
});

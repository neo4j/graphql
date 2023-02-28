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

import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { cleanNodes } from "../../../utils/clean-nodes";
import { Neo4jGraphQL } from "../../../../src";
import { UniqueType } from "../../../utils/graphql-types";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import Neo4j from "../../neo4j";

describe("Subscriptions connect with delete", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;
    let plugin: TestSubscriptionsPlugin;

    let typeDefs: string;
    let typeActor: UniqueType;
    let typeMovie: UniqueType;
    let typePerson: UniqueType;
    let typeInfluencer: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        plugin = new TestSubscriptionsPlugin();
    });

    beforeEach(async () => {
        typeActor = new UniqueType("Actor");
        typeMovie = new UniqueType("Movie");
        typePerson = new UniqueType("Person");
        typeInfluencer = new UniqueType("Influencer");
        session = await neo4j.getSession();

        typeDefs = `
            type ${typeMovie} {
                title: String!
                actors: [${typeActor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                imdbId: Int @unique
            }
            
            type ${typeActor} {
                name: String!
                id: Int @unique
                movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }
            
            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }
            
            interface Directed @relationshipProperties {
                year: Int!
            }
            
            interface Review @relationshipProperties {
                score: Int!
            }
        
            type ${typePerson} implements Reviewer {
                name: String!
                reputation: Int!
                id: Int @unique
                reviewerId: Int @unique
                movies: [${typeMovie}!]! @relationship(type: "REVIEWED", direction: OUT, properties: "Review")
            }
            
            type ${typeInfluencer} implements Reviewer {
                reputation: Int!
                url: String!
                reviewerId: Int
            }
            
            union Director = ${typePerson} | ${typeActor}
            
            interface Reviewer {
                reputation: Int!
                reviewerId: Int

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
        await cleanNodes(session, [typeActor, typeMovie, typePerson, typeInfluencer]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("deletes nested connection to interface type", async () => {
        await session.run(`
            CREATE (m:${typeMovie.name} { title: "John Wick" })
            CREATE (p:${typePerson.name} { name: "Ana", reputation: 100 })
            CREATE (i:${typeInfluencer.name} { url: "/bob", reputation: 1 })
            MERGE (m)<-[:REVIEWED {score: 10}]-(i)
            MERGE (m)<-[:REVIEWED {score: 10}]-(p)
        `);

        const query = `
        mutation {
            ${typeMovie.operations.update}(
                    where: {
                      title: "John Wick"
                    },
                    disconnect: {
                        reviewers:  [
                            {
                              where: {
                                    node: {
                                        _on: {
                                            ${typePerson}: {
                                                name: "Ana"
                                            },
                                            ${typeInfluencer}: {
                                                reputation: 1
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    }
            ) {
                ${typeMovie.plural} {
                    title
                }
            }
        }
    `;

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(Number),
                    id_from: expect.any(Number),
                    id_to: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "delete_relationship",
                    properties: {
                        from: {
                            url: "/bob",
                            reputation: 1,
                        },
                        to: {
                            title: "John Wick",
                        },
                        relationship: {
                            score: 10,
                        },
                    },
                    relationshipName: "REVIEWED",
                    fromTypename: typeInfluencer.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(Number),
                    id_from: expect.any(Number),
                    id_to: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "delete_relationship",
                    properties: {
                        from: {
                            name: "Ana",
                            reputation: 100,
                        },
                        to: {
                            title: "John Wick",
                        },
                        relationship: {
                            score: 10,
                        },
                    },
                    relationshipName: "REVIEWED",
                    fromTypename: typePerson.name,
                    toTypename: typeMovie.name,
                },
            ])
        );
    });
});

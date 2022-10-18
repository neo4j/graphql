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
import { Neo4jGraphQLSubscriptionsSingleInstancePlugin } from "../../../src";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/2250", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Movie: UniqueType;
    let Person: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        Movie = generateUniqueType("Movie");
        Person = generateUniqueType("Person");
        Person = generateUniqueType("Actor");
        session = await neo4j.getSession();

        const typeDefs = `
            type ${Movie} {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
            }

            type ${Actor} {
                name: String!
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            interface Directed @relationshipProperties {
                year: Int!
            }

            type ${Person} {
                name: String!
                reputation: Int!
            }

            union Director = ${Person} | ${Actor}
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                subscriptions: new Neo4jGraphQLSubscriptionsSingleInstancePlugin(),
            },
        });
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("nested update with create while using subscriptions should generate valid Cypher", async () => {
        const mutation = `
            mutation {
                ${Movie.operations.update}(
                    update: {
                        directors: {
                            ${Actor}: [
                                {
                                    where: { node: { name: "Keanu Reeves" } }
                                    update: {
                                        edge: { year: 2020 }
                                        node: {
                                            name: "KEANU Reeves"
                                            movies: [
                                                {
                                                    create: [
                                                        { edge: { screenTime: 2345 }, node: { title: "Constantine" } }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ) {
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

        const mutationResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: mutation,
            contextValue: neo4j.getContextValues(),
        });

        expect(mutationResult.errors).toBeFalsy();
    });
});

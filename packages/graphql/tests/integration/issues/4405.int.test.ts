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

import type { Driver } from "neo4j-driver";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { graphql } from "graphql";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/4405", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neo4jGraphql: Neo4jGraphQL;
    const Movie = new UniqueType("Movie");
    const Actor = new UniqueType("Actor");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        const typeDefs = /* GraphQL */ `
            type ${Movie.name} {
                title: String
            }

            type ${Actor.name}
                @authorization(
                    validate: [
                        {
                            when: [BEFORE]
                            operations: [READ]
                            where: { node: { actedInConnection_SOME: { node: { title_IN: ["Matrix", "John Wick"] } } } }
                        }
                    ]
                ) {
                name: String!
                actedIn: [${Movie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;
        neo4jGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                CREATE (m:${Movie.name} {title: "Matrix" })<-[:ACTED_IN]-(a:${Actor.name} { name: "Keanu"})
                CREATE (a)-[:ACTED_IN]->(:${Movie.name} {title: "John Wick" })
                CREATE (m2:${Movie.name} {title: "Hunger games" })<-[:ACTED_IN]-(a2:${Actor.name} { name: "Laurence"})

                `,
                {}
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        try {
            await cleanNodesUsingSession(session, [Movie.name, Actor.name]);
        } finally {
            await session.close();
        }
        await driver.close();
    });

    test("should not raise if title is the filter array value", async () => {
        const schema = await neo4jGraphql.getSchema();

        const query = /* GraphQL */ `
            query Actors {
                ${Actor.plural}(where: { name: "Keanu"}) {
                    name
                }
            }
        `;

        const response = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ jwt: { uid: "user-1" } }),
        });
        expect(response.errors).toBeFalsy();
        expect(response.data?.[Actor.plural]).toStrictEqual(
            expect.arrayContaining([
                {
                    name: "Keanu",
                },
            ])
        );
    });

    test("should raise if title is not in the filter array value", async () => {
        const schema = await neo4jGraphql.getSchema();

        const query = /* GraphQL */ `
            query Actors {
                ${Actor.plural}(where: { name: "Laurence"}) {
                    name
                }
            }
        `;

        const response = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ jwt: { uid: "user-1" } }),
        });
        expect(response.errors?.[0]?.message).toContain("Forbidden");
    });
});

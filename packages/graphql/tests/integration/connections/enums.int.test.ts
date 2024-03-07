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
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("Enum Relationship Properties", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Movie = new UniqueType("Movie");
        Actor = new UniqueType("Actor");
        const typeDefs = `
            type ${Actor} {
                name: String!
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
    
            type ${Movie} {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
    
            enum RoleType {
                LEADING
                SUPPORTING
            }
    
            type ActedIn @relationshipProperties {
                roleType: RoleType!
            }
        `;
        const roleTypeResolver = {
            LEADING: "Leading",
            SUPPORTING: "Supporting",
        };

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: { RoleType: roleTypeResolver },
        });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a movie and an actor, with an enum as a relationship property", async () => {
        const session = await neo4j.getSession();

        const title = generate({
            charset: "alphabetic",
        });

        const name = generate({
            charset: "alphabetic",
        });

        const create = /* GraphQL */ `
            mutation CreateMovies($title: String!, $name: String!) {
                ${Movie.operations.create}(
                    input: [
                        { title: $title, actors: { create: [{ edge: { roleType: LEADING }, node: { name: $name } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    roleType
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                contextValue: neo4j.getContextValues(),
                variableValues: { title, name },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                [Movie.operations.create]: {
                    [Movie.plural]: [
                        {
                            title,
                            actorsConnection: { edges: [{ properties: { roleType: "LEADING" }, node: { name } }] },
                        },
                    ],
                },
            });

            const result = await session.run(`
                MATCH (m:${Movie})<-[ai:ACTED_IN]-(a:${Actor})
                WHERE m.title = "${title}" AND a.name = "${name}"
                RETURN ai
            `);

            expect((result.records[0]?.toObject() as any).ai.properties).toEqual({ roleType: "Leading" });
        } finally {
            await session.close();
        }
    });
});

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
import { graphql, GraphQLError } from "graphql";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4jHelper from "../neo4j";
import { UniqueType } from "../../utils/graphql-types";

describe("@coalesce directive", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("on non-primitive field should throw an error", async () => {
        const typeDefs = `
            type User {
                name: String!
                location: Point! @coalesce(value: "default")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
            new GraphQLError("@coalesce is not supported by Spatial types."),
        ]);
    });

    test("on DateTime field should throw an error", async () => {
        const typeDefs = `
            type User {
                name: String!
                createdAt: DateTime! @coalesce(value: "1970-01-01T00:00:00.000Z")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
            new GraphQLError("@coalesce is not supported by Temporal types."),
        ]);
    });

    test("with an argument with a type which doesn't match the field should throw an error", async () => {
        const typeDefs = `
            type User {
                name: String! @coalesce(value: 2)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
            new GraphQLError("@coalesce.value on String fields must be of type String"),
        ]);
    });

    test("allows querying with null properties without affecting the returned result", async () => {
        const type = new UniqueType("Movie");

        const typeDefs = `
            type ${type.name} {
                id: ID!
                classification: String @coalesce(value: "Unrated")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = `
            query {
                ${type.plural}(where: {classification: "Unrated"}){
                    id
                    classification
                }
            }
        `;

        const session = await neo4j.getSession();

        const id = generate({
            charset: "alphabetic",
        });

        try {
            await session.run(`
                CREATE (:${type.name} {id: "${id}"})
            `);

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any)[type.plural][0]).toEqual({
                id,
                classification: null,
            });
        } finally {
            await session.close();
        }
    });

    test("with enum values", async () => {
        const type = new UniqueType("Movie");

        const typeDefs = `
            enum Status {
                ACTIVE
                INACTIVE
            }
            type ${type.name} {
                id: ID
                status: Status @coalesce(value: ACTIVE)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = `
            query {
                ${type.plural}(where: {status: ACTIVE}){
                    id
                    status
                }
            }
        `;

        const session = await neo4j.getSession();

        const id = generate({
            charset: "alphabetic",
        });

        try {
            await session.run(`
                CREATE (:${type.name} {id: "${id}"})
            `);

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any)[type.plural][0]).toEqual({
                id,
                status: null,
            });
        } finally {
            await session.close();
        }
    });

    test("with enum list values", async () => {
        const type = new UniqueType("Movie");

        const typeDefs = `
            enum Status {
                ACTIVE
                INACTIVE
            }

            type ${type.name} {
                id: ID
                statuses: [Status!] @coalesce(value: [ACTIVE, INACTIVE])
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = `
            query {
                ${type.plural}(where: {statuses: [ACTIVE, INACTIVE]}){
                    id
                    statuses
                }
            }
        `;

        const session = await neo4j.getSession();

        const id = generate({
            charset: "alphabetic",
        });

        try {
            await session.run(`
                CREATE (:${type.name} {id: "${id}"})
            `);

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any)[type.plural][0]).toEqual({
                id,
                statuses: null,
            });
        } finally {
            await session.close();
        }
    });
});

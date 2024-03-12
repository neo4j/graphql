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
import { applyMiddleware } from "graphql-middleware";
import { type Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../src/classes";
import { cleanNodesUsingSession } from "../utils/clean-nodes";
import { UniqueType } from "../utils/graphql-types";
import Neo4jHelper from "./neo4j";

describe("Middleware Resolvers", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let Movie: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Movie = new UniqueType("Movie");
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await cleanNodesUsingSession(session, [Movie]);
        await driver.close();
    });

    test("should allow middleware Query resolver to modify arguments", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type ${Movie} {
              id: ID
              custom: String
            }
        `;

        const id = generate({
            charset: "alphabetic",
        });
        const custom = "modified string";

        function middlewareResolver(resolve, root, args, context, info) {
            const newArgs = {
                where: {
                    custom: args.where.custom.replace("original", "modified"),
                },
            } as any;

            return resolve(root, newArgs, context, info);
        }

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const schemaWithMiddleware = applyMiddleware(await neoSchema.getSchema(), {
            Query: {
                [Movie.plural]: middlewareResolver,
            },
        });

        const query = `
            {
                ${Movie.plural}(where: { custom: "original string" }) { custom }
            }
        `;

        try {
            await session.run(
                `
                CREATE (:${Movie} {id: $id, custom: $custom})
            `,
                {
                    id,
                    custom,
                }
            );

            const gqlResult = await graphql({
                schema: schemaWithMiddleware,
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any)[Movie.plural][0].custom).toEqual(custom);
        } finally {
            await session.close();
        }
    });

    test("should allow middleware Mutation resolver to modify arguments", async () => {
        const typeDefs = `
            type ${Movie} {
              id: ID
              custom: String
            }
        `;

        const id = generate({
            charset: "alphabetic",
        });
        const custom = "modified string";

        function middlewareResolver(resolve, root, args, context, info) {
            const originalObject = args.input[0];
            const newObject = {
                id: originalObject.id,
                custom: originalObject.custom.replace("original", "modified"),
            };
            const newArgs = {
                input: [newObject],
            } as any;

            return resolve(root, newArgs, context, info);
        }

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const schemaWithMiddleware = applyMiddleware(await neoSchema.getSchema(), {
            Mutation: {
                [Movie.operations.create]: middlewareResolver,
            },
        });

        const mutation = `
            mutation {
                ${Movie.operations.create}(input: [{
                    id: "${id}"
                    custom: "original string"
                }]) {
                    ${Movie.plural} {
                        custom
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: schemaWithMiddleware,
            source: mutation,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[Movie.operations.create][Movie.plural][0].custom).toEqual(custom);
    });
});

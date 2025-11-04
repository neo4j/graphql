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

import { applyMiddleware } from "graphql-middleware";
import { generate } from "randomstring";
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("Middleware Resolvers", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should allow middleware Query resolver to modify arguments", async () => {
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

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

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

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {id: $id, custom: $custom})
            `,
            {
                id,
                custom,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            schema: schemaWithMiddleware,
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[Movie.plural][0].custom).toEqual(custom);
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

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

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

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            schema: schemaWithMiddleware,
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[Movie.operations.create][Movie.plural][0].custom).toEqual(custom);
    });
});

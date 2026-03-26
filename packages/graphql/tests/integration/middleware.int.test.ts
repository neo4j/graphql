/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
            type ${Movie} @node {
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
                    custom_EQ: args.where.custom_EQ.replace("original", "modified"),
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
                ${Movie.plural}(where: { custom_EQ: "original string" }) { custom }
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
            type ${Movie} @node {
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

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

import { getDirective, MapperKind, mapSchema } from "@graphql-tools/utils";
import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/349", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    function disallowDirective(directiveName: string) {
        return {
            disallowDirectiveTypeDefs: `directive @${directiveName} on FIELD_DEFINITION`,
            disallowDirectiveTransformer: (schema: GraphQLSchema) =>
                mapSchema(schema, {
                    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
                        const fieldDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
                        if (fieldDirective) {
                            fieldConfig.resolve = () => {
                                throw new Error("go away");
                            };
                        }
                        return fieldConfig;
                    },
                }),
        };
    }

    const { disallowDirectiveTypeDefs, disallowDirectiveTransformer } = disallowDirective("disallow");

    describe("https://github.com/neo4j/graphql/issues/349#issuecomment-885295157", () => {
        let schema: GraphQLSchema;

        beforeAll(async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: [
                    disallowDirectiveTypeDefs,
                    gql`
                        type Mutation {
                            doStuff: String! @disallow
                        }

                        type Query {
                            noop: Boolean
                        }
                    `,
                ],

                driver,
                resolvers: { Mutation: { doStuff: () => "OK" } },
            });

            schema = disallowDirectiveTransformer(await neoSchema.getSchema());
        });

        test("DisallowDirective", async () => {
            const gqlResult = await graphql({
                schema,
                source: /* GraphQL */ `
                    mutation {
                        doStuff
                    }
                `,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.data).toBeNull();
            expect(gqlResult.errors).toBeTruthy();
        });
    });

    describe("https://github.com/neo4j/graphql/issues/349#issuecomment-885311918", () => {
        let schema: GraphQLSchema;

        beforeAll(async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: [
                    disallowDirectiveTypeDefs,
                    gql`
                        type NestedResult {
                            stuff: String! @disallow
                        }

                        type Mutation {
                            doStuff: String! @disallow
                            doNestedStuff: NestedResult!
                        }

                        type Query {
                            getStuff: String! @disallow
                            getNestedStuff: NestedResult!
                        }
                    `,
                ],

                driver,
                resolvers: {
                    NestedResult: {
                        stuff: (parent: string) => parent,
                    },

                    Mutation: {
                        doStuff: () => "OK",
                        doNestedStuff: () => "OK",
                    },

                    Query: {
                        getStuff: () => "OK",
                        getNestedStuff: () => "OK",
                    },
                },
            });

            schema = disallowDirectiveTransformer(await neoSchema.getSchema());
        });

        test("mutation top - DisallowDirective", async () => {
            const gqlResult = await graphql({
                schema,
                source: /* GraphQL */ `
                    mutation {
                        doStuff
                    }
                `,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.data).toBeNull();
            expect(gqlResult.errors && gqlResult.errors[0]?.message).toBe("go away");
        });

        test("query top - DisallowDirective", async () => {
            const gqlResult = await graphql({
                schema,
                source: /* GraphQL */ `
                    query {
                        getStuff
                    }
                `,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.data).toBeNull();
            expect(gqlResult.errors && gqlResult.errors[0]?.message).toBe("go away");
        });

        test("mutation nested - DisallowDirective", async () => {
            const gqlResult = await graphql({
                schema,
                source: /* GraphQL */ `
                    mutation {
                        doNestedStuff {
                            stuff
                        }
                    }
                `,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.data).toBeNull();
            expect(gqlResult.errors && gqlResult.errors[0]?.message).toBe("go away");
        });

        test("query nested - DisallowDirective", async () => {
            const gqlResult = await graphql({
                schema,
                source: /* GraphQL */ `
                    query {
                        getNestedStuff {
                            stuff
                        }
                    }
                `,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.data).toBeNull();
            expect(gqlResult.errors && gqlResult.errors[0]?.message).toBe("go away");
        });
    });

    describe("schemaDirectives can be an empty object", () => {
        const neo4jGraphQL = new Neo4jGraphQL({
            typeDefs: [
                disallowDirectiveTypeDefs,
                gql`
                    directive @disallow on FIELD_DEFINITION

                    type Mutation {
                        doStuff: String! @disallow
                    }

                    type Query {
                        noop: Boolean
                    }
                `,
            ],

            driver,
            resolvers: { Mutation: { doStuff: () => "OK" } },
        });

        test("DisallowDirective", async () => {
            const gqlResult = await graphql({
                schema: await neo4jGraphQL.getSchema(),
                source: /* GraphQL */ `
                    mutation {
                        doStuff
                    }
                `,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.data?.doStuff).toBe("OK");
            expect(gqlResult.errors).toBeFalsy();
        });
    });
});

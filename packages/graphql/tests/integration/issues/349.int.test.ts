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

import neo4j from "neo4j-driver";
import { SchemaDirectiveVisitor } from "@graphql-tools/utils";
import { graphql } from "graphql";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/349", () => {
    type Field = Parameters<SchemaDirectiveVisitor["visitFieldDefinition"]>[0];

    class DisallowDirective extends SchemaDirectiveVisitor {
        public visitFieldDefinition(field: Field) {
            // eslint-disable-next-line no-param-reassign
            field.resolve = () => {
                // Disallow any and all access, all the time
                throw new Error("go away");
            };
        }
    }

    const schemaDirectives = {
        disallow: DisallowDirective,
    };

    describe("https://github.com/neo4j/graphql/issues/349#issuecomment-885295157", () => {
        const neo4jGraphQL = new Neo4jGraphQL({
            typeDefs: /* GraphQL */ `
                directive @disallow on FIELD_DEFINITION

                type Mutation {
                    doStuff: String! @disallow
                }

                type Query {
                    noop: Boolean
                }
            `,

            driver: neo4j.driver("bolt://localhost:7687"),
            resolvers: { Mutation: { doStuff: () => "OK" } },
            schemaDirectives,
        });

        test("DisallowDirective", async () => {
            const gqlResult = await graphql({
                schema: neo4jGraphQL.schema,
                source: /* GraphQL */ `
                    mutation {
                        doStuff
                    }
                `,
                contextValue: { driver: neo4j.driver("bolt://localhost:7687") },
            });

            expect(gqlResult.data).toBeNull();
            expect(gqlResult.errors).toBeTruthy();
        });
    });

    describe("https://github.com/neo4j/graphql/issues/349#issuecomment-885311918", () => {
        const neo4jGraphQL = new Neo4jGraphQL({
            typeDefs: /* GraphQL */ `
                directive @disallow on FIELD_DEFINITION

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

            driver: neo4j.driver("bolt://localhost:7687"),
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
            schemaDirectives,
        });

        test("mutation top - DisallowDirective", async () => {
            const gqlResult = await graphql({
                schema: neo4jGraphQL.schema,
                source: /* GraphQL */ `
                    mutation {
                        doStuff
                    }
                `,
                contextValue: { driver: neo4j.driver("bolt://localhost:7687") },
            });

            expect(gqlResult.data).toBeNull();
            expect(gqlResult.errors && gqlResult.errors[0].message).toBe("go away");
        });

        test("query top - DisallowDirective", async () => {
            const gqlResult = await graphql({
                schema: neo4jGraphQL.schema,
                source: /* GraphQL */ `
                    query {
                        getStuff
                    }
                `,
                contextValue: { driver: neo4j.driver("bolt://localhost:7687") },
            });

            expect(gqlResult.data).toBeNull();
            expect(gqlResult.errors && gqlResult.errors[0].message).toBe("go away");
        });

        test("mutation nested - DisallowDirective", async () => {
            const gqlResult = await graphql({
                schema: neo4jGraphQL.schema,
                source: /* GraphQL */ `
                    mutation {
                        doNestedStuff {
                            stuff
                        }
                    }
                `,
                contextValue: { driver: neo4j.driver("bolt://localhost:7687") },
            });

            expect(gqlResult.data).toBeNull();
            expect(gqlResult.errors && gqlResult.errors[0].message).toBe("go away");
        });

        test("query nested - DisallowDirective", async () => {
            const gqlResult = await graphql({
                schema: neo4jGraphQL.schema,
                source: /* GraphQL */ `
                    query {
                        getNestedStuff {
                            stuff
                        }
                    }
                `,
                contextValue: { driver: neo4j.driver("bolt://localhost:7687") },
            });

            expect(gqlResult.data).toBeNull();
            expect(gqlResult.errors && gqlResult.errors[0].message).toBe("go away");
        });
    });

    describe("schemaDirectives can be an empty object", () => {
        const neo4jGraphQL = new Neo4jGraphQL({
            typeDefs: /* GraphQL */ `
                directive @disallow on FIELD_DEFINITION

                type Mutation {
                    doStuff: String! @disallow
                }

                type Query {
                    noop: Boolean
                }
            `,

            driver: neo4j.driver("bolt://localhost:7687"),
            resolvers: { Mutation: { doStuff: () => "OK" } },
            schemaDirectives: {},
        });

        test("DisallowDirective", async () => {
            const gqlResult = await graphql({
                schema: neo4jGraphQL.schema,
                source: /* GraphQL */ `
                    mutation {
                        doStuff
                    }
                `,
                contextValue: { driver: neo4j.driver("bolt://localhost:7687") },
            });

            expect(gqlResult.data?.doStuff).toEqual("OK");
            expect(gqlResult.errors).toBeFalsy();
        });
    });
});

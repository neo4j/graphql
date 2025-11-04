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

import type { GraphQLResolveInfo } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import type { GetNeo4jResolveTreeOptions } from "./get-neo4j-resolve-tree";
import getNeo4jResolveTree from "./get-neo4j-resolve-tree";

describe("getNeo4jResolveTree", () => {
    const schema = makeExecutableSchema({
        resolvers: {},
        typeDefs: `
        type Query {
            aQuery(test: String): String
        }
        type Mutation {
            aMutation(test: String, test2: String, test3: Int): String
        }
        type Subscription {
            aSubscription(test: String): String
        }
        `,
    });

    test("creates a resolve tree for a query", () => {

        const resolveTree = getNeo4jResolveTree({
            schema,
        } as GraphQLResolveInfo, {
            resolveTree: {
                name: 'aQuery',
                args: {
                    test: 'test',
                },
                fieldsByTypeName: {},
            } as unknown,
        } as GetNeo4jResolveTreeOptions);
        expect(resolveTree).toEqual({
            name: 'aQuery',
            args: {
                test: 'test',
            },
            fieldsByTypeName: {

            },
        });
    });
    test("creates a resolve tree for a mutation", () => {

        const resolveTree = getNeo4jResolveTree({
            schema,
        } as GraphQLResolveInfo, {
            resolveTree: {
                name: 'aMutation',
                args: {
                    test: 'test',
                },
                fieldsByTypeName: {},
            } as unknown,
        } as GetNeo4jResolveTreeOptions);
        expect(resolveTree).toEqual({
            name: 'aMutation',
            args: {
                test: 'test',
            },
            fieldsByTypeName: {

            },
        });
    });
    test("creates a resolve tree for a subscription", () => {

        const resolveTree = getNeo4jResolveTree({
            schema,
        } as GraphQLResolveInfo, {
            resolveTree: {
                name: 'aSubscription',
                args: {
                    test: 'test',
                },
                fieldsByTypeName: {},
            } as unknown,
        } as GetNeo4jResolveTreeOptions);
        expect(resolveTree).toEqual({
            name: 'aSubscription',
            args: {
                test: 'test',
            },
            fieldsByTypeName: {

            },
        });
    });
    test("parses resolver args if passed in", () => {

        const resolveTree = getNeo4jResolveTree({
            schema,
        } as GraphQLResolveInfo, {
            resolveTree: {
                name: 'aMutation',
                args: {
                    test: 'test',
                    test2: 'test2',
                },
                fieldsByTypeName: {},
            } as unknown,
            args: {
                test2: 'test2 from resolver',
                test3: 42,
            } as any,
        } as GetNeo4jResolveTreeOptions);
        expect(resolveTree).toEqual({
            name: 'aMutation',
            args: {
                test: 'test',
                test2: 'test2 from resolver',
                test3: {
                    high: 0,
                    low: 42,
                },
            },
            fieldsByTypeName: {

            },
        });
    });
});

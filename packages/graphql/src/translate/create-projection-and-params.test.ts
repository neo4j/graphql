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

import { ResolveTree } from "graphql-parse-resolve-info";
import createProjectionAndParams from "./create-projection-and-params";
import { Neo4jGraphQL } from "../classes";
import { Context } from "../types";
import { NodeBuilder } from "../../tests/utils/builders/node-builder";

describe("createProjectionAndParams", () => {
    test("should be a function", () => {
        expect(createProjectionAndParams).toBeInstanceOf(Function);
    });

    test("should return the correct projection with 1 selection", () => {
        const resolveTree: ResolveTree = {
            alias: "movies",
            name: "movies",
            fieldsByTypeName: {
                Movie: {
                    title: {
                        name: "title",
                        alias: "title",
                        args: {},
                        fieldsByTypeName: {},
                    },
                },
            },
            args: {},
        };

        const node = new NodeBuilder({
            name: "Movie",

            primitiveFields: [
                {
                    fieldName: "title",
                    typeMeta: {
                        name: "String",
                        array: false,
                        required: false,
                        pretty: "String",
                        input: {
                            where: {
                                type: "String",
                                pretty: "String",
                            },
                            create: { type: "String", pretty: "String" },
                            update: { type: "String", pretty: "String" },
                        },
                    },
                    otherDirectives: [],
                    arguments: [],
                },
            ],
        }).instance();

        // @ts-ignore
        const neo4jgraphql: Neo4jGraphQL = {
            nodes: [node],
        };

        // @ts-ignore
        const context: Context = { neo4jgraphql, resolveTree };

        const result = createProjectionAndParams({ resolveTree, node, context, varName: "this" });

        expect(result[0]).toBe(`{ .title }`);
        expect(result[1]).toMatchObject({});
    });
});

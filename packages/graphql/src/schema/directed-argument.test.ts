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

import { RelationshipQueryDirectionOption } from "../constants";
import type { RelationshipAdapter } from "../schema-model/relationship/model-adapters/RelationshipAdapter";
import { DEPRECATE_DIRECTED_ARGUMENT } from "./constants";
import { addDirectedArgument, getDirectedArgument } from "./directed-argument";

describe("Directed argument", () => {
    describe("getDirectedArgument", () => {
        test("should return default true argument for DEFAULT_DIRECTED", () => {
            expect(
                getDirectedArgument(
                    {
                        queryDirection: RelationshipQueryDirectionOption.DEFAULT_DIRECTED,
                    } as RelationshipAdapter,
                    {}
                )
            ).toEqual({
                type: "Boolean",
                defaultValue: true,
                directives: [DEPRECATE_DIRECTED_ARGUMENT],
            });
        });

        test("should return default false argument for DEFAULT_UNDIRECTED", () => {
            expect(
                getDirectedArgument(
                    {
                        queryDirection: RelationshipQueryDirectionOption.DEFAULT_UNDIRECTED,
                    } as RelationshipAdapter,
                    {}
                )
            ).toEqual({
                type: "Boolean",
                defaultValue: false,
                directives: [DEPRECATE_DIRECTED_ARGUMENT],
            });
        });

        test("should return an undefined argument for DIRECTED_ONLY", () => {
            expect(
                getDirectedArgument(
                    {
                        queryDirection: RelationshipQueryDirectionOption.DIRECTED_ONLY,
                    } as RelationshipAdapter,
                    {}
                )
            ).toBeUndefined();
        });

        test("should return an undefined argument for UNDIRECTED_ONLY", () => {
            expect(
                getDirectedArgument(
                    {
                        queryDirection: RelationshipQueryDirectionOption.UNDIRECTED_ONLY,
                    } as RelationshipAdapter,
                    {}
                )
            ).toBeUndefined();
        });

        test("should return undefined if directedArgument in excludeDeprecatedDirectives", () => {
            expect(
                getDirectedArgument(
                    {
                        queryDirection: RelationshipQueryDirectionOption.DEFAULT_UNDIRECTED,
                    } as RelationshipAdapter,
                    { excludeDeprecatedFields: { directedArgument: true } }
                )
            ).toBeUndefined();
        });
    });

    describe("addDirectedArgument", () => {
        test("should add directed argument if DEFAULT_DIRECTED", () => {
            const args = addDirectedArgument(
                { arg1: "dsa" },
                {
                    queryDirection: RelationshipQueryDirectionOption.DEFAULT_DIRECTED,
                } as RelationshipAdapter,
                {}
            );
            expect(args).toEqual({
                arg1: "dsa",
                directed: {
                    type: "Boolean",
                    defaultValue: true,
                    directives: [DEPRECATE_DIRECTED_ARGUMENT],
                },
            });
        });
        test("should not add any argument if DIRECTED_ONLY", () => {
            const args = addDirectedArgument(
                { arg1: "dsa" },
                {
                    queryDirection: RelationshipQueryDirectionOption.DIRECTED_ONLY,
                } as RelationshipAdapter,
                {}
            );
            expect(args).toEqual({
                arg1: "dsa",
            });
        });
    });
});

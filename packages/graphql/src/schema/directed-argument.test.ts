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
import { RelationFieldBuilder } from "../../tests/utils/builders/relation-field-builder";
import { addDirectedArgument, getDirectedArgument } from "./directed-argument";

describe("directed argument", () => {
    describe("getDirectedArgument", () => {
        test("should return default true argument for DEFAULT_DIRECTED", () => {
            const relationField = new RelationFieldBuilder({
                queryDirection: RelationshipQueryDirectionOption.DEFAULT_DIRECTED,
            }).instance();
            expect(getDirectedArgument(relationField)).toEqual({
                type: "Boolean",
                defaultValue: true,
            });
        });

        test("should return default false argument for DEFAULT_UNDIRECTED", () => {
            const relationField = new RelationFieldBuilder({
                queryDirection: RelationshipQueryDirectionOption.DEFAULT_UNDIRECTED,
            }).instance();
            expect(getDirectedArgument(relationField)).toEqual({
                type: "Boolean",
                defaultValue: false,
            });
        });

        test("should return an undefined argument for DIRECTED_ONLY", () => {
            const relationField = new RelationFieldBuilder({
                queryDirection: RelationshipQueryDirectionOption.DIRECTED_ONLY,
            }).instance();
            expect(getDirectedArgument(relationField)).toBeUndefined();
        });

        test("should return an undefined argument for UNDIRECTED_ONLY", () => {
            const relationField = new RelationFieldBuilder({
                queryDirection: RelationshipQueryDirectionOption.UNDIRECTED_ONLY,
            }).instance();
            expect(getDirectedArgument(relationField)).toBeUndefined();
        });
    });

    describe("addDirectedArgument", () => {
        test("should add directed argument if DEFAULT_DIRECTED", () => {
            const relationField = new RelationFieldBuilder({
                queryDirection: RelationshipQueryDirectionOption.DEFAULT_DIRECTED,
            }).instance();

            const args = addDirectedArgument({ arg1: "dsa" }, relationField);
            expect(args).toEqual({
                arg1: "dsa",
                directed: {
                    type: "Boolean",
                    defaultValue: true,
                },
            });
        });
        test("should not add any argument if DIRECTED_ONLY", () => {
            const relationField = new RelationFieldBuilder({
                queryDirection: RelationshipQueryDirectionOption.DIRECTED_ONLY,
            }).instance();

            const args = addDirectedArgument({ arg1: "dsa" }, relationField);
            expect(args).toEqual({
                arg1: "dsa",
            });
        });
    });
});

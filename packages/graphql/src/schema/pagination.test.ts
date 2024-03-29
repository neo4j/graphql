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
import { offsetToCursor } from "graphql-relay";
import { createConnectionWithEdgeProperties } from "./pagination";

describe("cursor-pagination", () => {
    describe("createConnectionWithEdgeProperties", () => {
        test("it should throw an error if first is less than 0", () => {
            const arraySlice = [...Array(20).keys()].map((key) => ({ node: { id: key } }));
            const args = { first: -1 };
            const totalCount = 50;

            expect(() => {
                createConnectionWithEdgeProperties({
                    source: { edges: arraySlice },
                    args,
                    totalCount,
                    selectionSet: undefined,
                });
            }).toThrow('Argument "first" must be a non-negative integer');
        });

        test("it returns all elements if the cursors are invalid", () => {
            const arraySlice = [...Array(20).keys()].map((key) => ({ node: { id: key } }));
            const args = { after: "invalid" };
            const totalCount = 50;
            const result = createConnectionWithEdgeProperties({
                source: { edges: arraySlice },
                args,
                totalCount,
                selectionSet: undefined,
            });
            expect(result).toStrictEqual({
                edges: arraySlice.map((edge, index) => ({ ...edge, cursor: offsetToCursor(index) })),
                pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: offsetToCursor(0),
                    endCursor: offsetToCursor(19),
                },
            });
        });

        test("it should return cursors from 0 to the size of the array when no arguments provided", () => {
            const arraySlice = [...Array(20).keys()].map((key) => ({ node: { id: key } }));
            const args = {};
            const totalCount = 50;
            const result = createConnectionWithEdgeProperties({
                source: { edges: arraySlice },
                args,
                totalCount,
                selectionSet: undefined,
            });
            expect(result).toStrictEqual({
                edges: arraySlice.map((edge, index) => ({ ...edge, cursor: offsetToCursor(index) })),
                pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: offsetToCursor(0),
                    endCursor: offsetToCursor(19),
                },
            });
        });
        test("it should return cursors from 11 to 31 when the after argument is provided and the array size is 20", () => {
            const arraySlice = [...Array(20).keys()].map((key) => ({ node: { id: key } }));
            const args = { after: offsetToCursor(10) };
            const totalCount = 50;
            const result = createConnectionWithEdgeProperties({
                source: { edges: arraySlice },
                args,
                totalCount,
                selectionSet: undefined,
            });
            expect(result).toStrictEqual({
                edges: arraySlice.map((edge, index) => ({ ...edge, cursor: offsetToCursor(index + 11) })),
                pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: offsetToCursor(11),
                    endCursor: offsetToCursor(30),
                },
            });
        });
    });
});

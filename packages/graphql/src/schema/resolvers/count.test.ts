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

const executeMock = jest.fn();

/* eslint-disable import/first */
import countResolver from "./count";
import { NodeBuilder } from "../../utils/test/builders/node-builder";
/* eslint-enable import/first */

jest.mock("../../translate", () => {
    return {
        translateCount: () => [],
    };
});

jest.mock("../../utils", () => {
    return {
        execute: executeMock,
    };
});

describe("Count resolver", () => {
    test("should return the correct; type, args and resolve", () => {
        const node = new NodeBuilder({
            name: "Movie",
        }).instance();

        const result = countResolver({ node });
        expect(result.type).toEqual("Int!");
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: "MovieWhere",
        });
    });

    test("should resolve correctly for a plain number", async () => {
        const node = new NodeBuilder({
            name: "Movie",
        }).instance();

        const result = countResolver({ node });

        executeMock.mockReturnValue({
            result: {
                records: [
                    {
                        get: () => 42,
                    },
                ],
            },
        });

        const foo = await result.resolve(null, null, "mockContext");

        expect(foo).toBe(42);
    });

    test("should resolve correctly for a Neo4j Integer", async () => {
        const node = new NodeBuilder({
            name: "Movie",
        }).instance();

        const result = countResolver({ node });

        executeMock.mockReturnValue({
            result: {
                records: [
                    {
                        get: () => 43,
                    },
                ],
            },
        });

        const foo = await result.resolve(null, null, "mockContext");

        expect(foo).toBe(43);
    });
});

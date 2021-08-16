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
import { int } from "neo4j-driver";
import { Node } from "../../classes";
import countResolver from "./count";
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
        // @ts-ignore
        const node: Node = {
            name: "Movie",
        };

        const result = countResolver({ node });
        expect(result.type).toEqual("Int!");
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: "MovieWhere",
        });
    });

    test("should resolve correctly for a plain number", async () => {
        // @ts-ignore
        const node: Node = {
            name: "Movie",
        };

        const result = countResolver({ node });

        executeMock.mockReturnValue({
            records: [
                {
                    _fields: [42],
                },
            ],
        });

        const foo = await result.resolve(null, null, "mockContext");

        expect(foo).toBe(42);
    });

    test("should resolve correctly for a Neo4j Integer", async () => {
        // @ts-ignore
        const node: Node = {
            name: "Movie",
        };

        const result = countResolver({ node });

        executeMock.mockReturnValue({
            records: [
                {
                    _fields: [int(43)],
                },
            ],
        });

        const foo = await result.resolve(null, null, "mockContext");

        expect(foo).toBe(43);
    });
});

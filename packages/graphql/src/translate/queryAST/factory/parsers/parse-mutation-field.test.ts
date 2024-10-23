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

import { parseMutationField } from "./parse-mutation-field";

describe("parseMutationField", () => {
    test("title", () => {
        expect(parseMutationField("title")).toEqual({
            fieldName: "title",
            operator: undefined,
        });
    });

    test("invalid operator", () => {
        expect(parseMutationField("title_SOMETHING")).toEqual({
            fieldName: "title_SOMETHING",
            operator: undefined,
        });
    });

    test.each(["PUSH", "POP", "ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "INCREMENT", "DECREMENT"])(
        "title_%s",
        (operator) => {
            expect(parseMutationField(`title_${operator}`)).toEqual({
                fieldName: "title",
                operator: operator,
            });
        }
    );
});

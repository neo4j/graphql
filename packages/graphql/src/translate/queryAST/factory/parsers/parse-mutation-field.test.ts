/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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

    test.each(["SET", "PUSH", "POP", "ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "INCREMENT", "DECREMENT"])(
        "title_%s",
        (operator) => {
            expect(parseMutationField(`title_${operator}`)).toEqual({
                fieldName: "title",
                operator: operator,
            });
        }
    );
});

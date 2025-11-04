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

import { makeDirectiveNode } from "@graphql-tools/utils";
import type { DirectiveNode } from "graphql";
import { Kind } from "graphql";
import { parseCoalesceAnnotation } from "./coalesce-annotation";
import { coalesceDirective } from "../../../graphql/directives";

describe("parseCoalesceAnnotation", () => {
    it("should parse correctly with string coalesce value", () => {
        const directive = makeDirectiveNode("coalesce", { value: "myCoalesceValue" }, coalesceDirective);
        const coalesceAnnotation = parseCoalesceAnnotation(directive);
        expect(coalesceAnnotation.value).toBe("myCoalesceValue");
    });
    it("should parse correctly with int coalesce value", () => {
        const directive = makeDirectiveNode("coalesce", { value: 25 }, coalesceDirective);
        const coalesceAnnotation = parseCoalesceAnnotation(directive);
        expect(coalesceAnnotation.value).toBe(25);
    });
    it("should parse correctly with float coalesce value", () => {
        const directive = makeDirectiveNode("coalesce", { value: 25.5 }, coalesceDirective);
        const coalesceAnnotation = parseCoalesceAnnotation(directive);
        expect(coalesceAnnotation.value).toBe(25.5);
    });
    it("should parse correctly with boolean coalesce value", () => {
        const directive = makeDirectiveNode("coalesce", { value: true }, coalesceDirective);
        const coalesceAnnotation = parseCoalesceAnnotation(directive);
        expect(coalesceAnnotation.value).toBe(true);
    });
    it("should parse correctly with enum coalesce value", () => {
        const directive: DirectiveNode = {
            kind: Kind.DIRECTIVE,
            name: {
                kind: Kind.NAME,
                value: "coalesce",
            },
            arguments: [
                {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: "value",
                    },
                    value: {
                        kind: Kind.STRING,
                        value: "myStringValue",
                    },
                },
            ],
        };
        const coalesceAnnotation = parseCoalesceAnnotation(directive);
        expect(coalesceAnnotation.value).toBe("myStringValue");
    });

    it("should throw error if no value is provided", () => {
        const directive: DirectiveNode = {
            kind: Kind.DIRECTIVE,
            name: {
                kind: Kind.NAME,
                value: "coalesce",
            },
            arguments: [],
        };
        expect(() => parseCoalesceAnnotation(directive)).toThrow("@coalesce directive must have a value");
    });
});

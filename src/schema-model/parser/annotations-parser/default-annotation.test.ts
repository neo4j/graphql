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
import { parseDefaultAnnotation } from "./default-annotation";
import { defaultDirective } from "../../../graphql/directives";

describe("parseDefaultAnnotation", () => {
    it("should parse correctly with string default value", () => {
        const directive = makeDirectiveNode("default", { value: "myDefaultValue" }, defaultDirective);
        const defaultAnnotation = parseDefaultAnnotation(directive);
        expect(defaultAnnotation.value).toBe("myDefaultValue");
    });
    it("should parse correctly with int default value", () => {
        const directive = makeDirectiveNode("default", { value: 25 }, defaultDirective);
        const defaultAnnotation = parseDefaultAnnotation(directive);
        expect(defaultAnnotation.value).toBe(25);
    });
    it("should parse correctly with float default value", () => {
        const directive = makeDirectiveNode("default", { value: 25.5 }, defaultDirective);
        const defaultAnnotation = parseDefaultAnnotation(directive);
        expect(defaultAnnotation.value).toBe(25.5);
    });
    it("should parse correctly with boolean default value", () => {
        const directive = makeDirectiveNode("default", { value: true }, defaultDirective);
        const defaultAnnotation = parseDefaultAnnotation(directive);
        expect(defaultAnnotation.value).toBe(true);
    });
    it("should parse correctly with enum default value", () => {
        const directive: DirectiveNode = {
            kind: Kind.DIRECTIVE,
            name: {
                kind: Kind.NAME,
                value: "default",
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
        const defaultAnnotation = parseDefaultAnnotation(directive);
        expect(defaultAnnotation.value).toBe("myStringValue");
    });
    it("should throw error if no value is provided", () => {
        const directive: DirectiveNode = {
            kind: Kind.DIRECTIVE,
            name: {
                kind: Kind.NAME,
                value: "default",
            },
            arguments: [],
        };
        expect(() => parseDefaultAnnotation(directive)).toThrow("@default directive must have a value");
    });
});

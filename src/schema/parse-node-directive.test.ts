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

import type { DirectiveNode, ObjectTypeDefinitionNode } from "graphql";
import { parse } from "graphql";
import parseNodeDirective from "./parse-node-directive";
import { NodeDirective } from "../classes/NodeDirective";

describe("parseNodeDirective", () => {
    test("should throw an error if incorrect directive is passed in", () => {
        const typeDefs = `
            type TestType @wrongdirective {
                label: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        expect(() => parseNodeDirective(directive)).toThrow(
            "Undefined or incorrect directive passed into parseNodeDirective function"
        );
    });

    test("should return a node directive with labels, type name ignored", () => {
        const typeDefs = `
            type TestType @node(labels:["Label", "AnotherLabel"]) {
                name: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        const expected = new NodeDirective({ labels: ["Label", "AnotherLabel"] });

        expect(parseNodeDirective(directive)).toMatchObject(expected);
    });

    test("should return a node directive with labels, type name included", () => {
        const typeDefs = `
            type TestType @node(labels:["TestType", "Label", "AnotherLabel"]) {
                name: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        const expected = new NodeDirective({ labels: ["TestType", "Label", "AnotherLabel"] });

        expect(parseNodeDirective(directive)).toMatchObject(expected);
    });
});

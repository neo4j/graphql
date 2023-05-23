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
import { QueryDirective } from "../classes/QueryDirective";
import parseQueryDirective from "./parse-query-directive";

describe("parseQueryDirective", () => {
    test("should throw an error if incorrect directive is passed in", () => {
        const typeDefs = `
            type TestType @wrongDirective {
                label: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        expect(() => parseQueryDirective(directive)).toThrowErrorMatchingInlineSnapshot(
            `"Undefined or incorrect directive passed into parseQueryDirective function"`
        );
    });

    test("should return read: true, aggregate: false with no arguments", () => {
        const typeDefs = `
            type TestType @query {
                name: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        const expected = new QueryDirective({read: true, aggregate: false});

        expect(parseQueryDirective(directive)).toMatchObject(expected);
    });

    test("should return read: true with only aggregate argument", () => {
        const typeDefs = `
            type TestType @query(aggregate: false) {
                name: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        const expected = new QueryDirective({read: true, aggregate: false});

        expect(parseQueryDirective(directive)).toMatchObject(expected);
    });

    test("should return aggregate: false with only read argument", () => {
        const typeDefs = `
            type TestType @query(read: true) {
                name: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        const expected = new QueryDirective({read: true, aggregate: false});

        expect(parseQueryDirective(directive)).toMatchObject(expected);
    });

    test("should return aggregate: true if specified", () => {
        const typeDefs = `
            type TestType @query(aggregate: true) {
                name: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        const expected = new QueryDirective({read: true, aggregate: true});

        expect(parseQueryDirective(directive)).toMatchObject(expected);
    });
});

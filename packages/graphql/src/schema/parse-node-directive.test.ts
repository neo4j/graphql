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

import { DirectiveNode, ObjectTypeDefinitionNode, parse } from "graphql";
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
        expect(() => parseNodeDirective(directive, definition)).toThrow(
            "Undefined or incorrect directive passed into parseNodeDirective function"
        );
    });

    test("should return a node directive with a label", () => {
        const typeDefs = `
            type TestType @node(label:"MyLabel") {
                name: String
            }
        `;
        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        const expected = new NodeDirective({ label: "MyLabel" });

        expect(parseNodeDirective(directive, definition)).toMatchObject(expected);
    });

    test("should return a node directive with additional labels", () => {
        const typeDefs = `
            type TestType @node(additionalLabels:["Label", "AnotherLabel"]) {
                name: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        const expected = new NodeDirective({ additionalLabels: ["Label", "AnotherLabel"] });

        expect(parseNodeDirective(directive, definition)).toMatchObject(expected);
    });

    test("should return a node directive with a label and additional labels", () => {
        const typeDefs = `
            type TestType @node(label:"MyLabel", additionalLabels:["Label", "AnotherLabel"]) {
                name: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        const expected = new NodeDirective({ label: "MyLabel", additionalLabels: ["Label", "AnotherLabel"] });

        expect(parseNodeDirective(directive, definition)).toMatchObject(expected);
    });

    test("should return a node directive with custom plural", () => {
        const typeDefs = `
            type TestType @node(plural: "testTypes") {
                name: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        const expected = new NodeDirective({ plural: "testTypes" });

        expect(parseNodeDirective(directive, definition)).toMatchObject(expected);
    });

    describe("global node flag", () => {
        test("should throw if a type already contains an id field", () => {
            const typeDefs = `
                type Movie @node(global: true) {
                    id: ID!
                    title: String!
                }
            `;
            const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
            const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
            expect(() => parseNodeDirective(directive, definition)).toThrow(
                `Type Movie already has a field "id." Either remove it, or if you need access to this property, consider using the "@alias" directive to access it via another field`
            );
        });

        test("should NOT throw if an id field contains an id field that is aliased", () => {
            const typeDefs = `
                type Movie @node(global: true) {
                    dbId: ID! @id @alias(property: "id")
                    title: String!
                }
            `;

            const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
            const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
            expect(() => parseNodeDirective(directive, definition)).not.toThrow();
        });

        test("should throw if there is no field with either the `@id` or `@unique` directive", () => {
            const typeDefs = `
                type Movie @node(global: true) {
                    title: String
                }
            `;
            const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
            const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
            expect(() => parseNodeDirective(directive, definition)).toThrow(
                "The `global` flag on the `@node` directive requires at least one field with the `@id` or `@unique` directive"
            );
        });

        test("should not throw if there is field with an @id directive", () => {
            const typeDefs = `
                type Person @node(global: true) {
                    firebaseId: ID! @id
                }
            `;
            const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
            const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
            expect(() => parseNodeDirective(directive, definition)).not.toThrow();
        });
        test("should not throw if there is field with a @unique directive", () => {
            const typeDefs = `
                type Person @node(global: true) {
                    email: String! @unique
                }
            `;
            const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
            const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
            expect(() => parseNodeDirective(directive, definition)).not.toThrow();
        });
        test("it should return a node directive with an idField set to the first field with an `@id` directive", () => {
            const typeDefs = `
            type Person @node(global: true) {
              aId: ID! @id
              bId: ID! @id
              cId: String! @unique
            }
          `;
            const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
            const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
            const expected = new NodeDirective({ global: true, globalIdField: "aId" });
            expect(parseNodeDirective(directive, definition)).toMatchObject(expected);
        });
    });
});

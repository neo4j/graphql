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
import { SubscriptionDirective } from "../classes/SubscriptionDirective";
import parseSubscriptionDirective from "./parse-subscription-directive";
import { SubscriptionEvent } from "../graphql/directives/subscription";

describe("parseSubscriptionDirective", () => {
    test("should throw an error if incorrect directive is passed in", () => {
        const typeDefs = `
            type TestType @wrongDirective {
                label: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        expect(() => parseSubscriptionDirective(directive)).toThrowErrorMatchingInlineSnapshot(
            `"Undefined or incorrect directive passed into parseSubscriptionDirective function"`
        );
    });

    test("should contain all the operations enabled when initialized with no argument", () => {
        const typeDefs = `
            type TestType @subscription {
                name: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        const expected = new SubscriptionDirective([
            SubscriptionEvent.CREATED,
            SubscriptionEvent.UPDATED,
            SubscriptionEvent.DELETED,
            SubscriptionEvent.RELATIONSHIP_CREATED,
            SubscriptionEvent.RELATIONSHIP_DELETED,
        ]);

        expect(parseSubscriptionDirective(directive)).toMatchObject(expected);
    });

    test("should return an instance with only update enabled, when only update passed", () => {
        const typeDefs = `
            type TestType @subscription(events: [UPDATED]) {
                name: String
            }
        `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const directive = definition?.directives?.length ? (definition.directives[0] as DirectiveNode) : undefined;
        const expected = new SubscriptionDirective([SubscriptionEvent.UPDATED]);

        expect(parseSubscriptionDirective(directive)).toMatchObject(expected);
    });
});

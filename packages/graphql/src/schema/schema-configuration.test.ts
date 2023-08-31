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

import type { ObjectTypeDefinitionNode, SchemaExtensionNode } from "graphql";
import { Kind, parse } from "graphql";
import { QueryDirective } from "../classes/QueryDirective";
import { SubscriptionDirective } from "../classes/SubscriptionDirective";
import {
    getSchemaConfigurationFlags,
    schemaConfigurationFromObjectTypeDefinition,
    schemaConfigurationFromSchemaExtensions,
} from "./schema-configuration";
import parseExcludeDirective from "./parse-exclude-directive";
import { SubscriptionEvent } from "../graphql/directives/subscription";

describe("schemaConfiguration", () => {
    test("schemaConfigurationFromObjectTypeDefinition should return a Schema Configuration object", () => {
        const typeDefs = `
        type TestType @query(read:false) @subscription {
            name: String
        }
    `;

        const definition = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;
        const schemaConfiguration = schemaConfigurationFromObjectTypeDefinition(definition);

        expect(schemaConfiguration).toMatchObject({
            queryDirective: new QueryDirective({ read: false, aggregate: false }),
            subscriptionDirective: new SubscriptionDirective([
                SubscriptionEvent.CREATED,
                SubscriptionEvent.DELETED,
                SubscriptionEvent.UPDATED,
                SubscriptionEvent.RELATIONSHIP_CREATED,
                SubscriptionEvent.RELATIONSHIP_DELETED,
            ]),
        });
    });

    test("schemaConfigurationFromSchemaExtensions should return a SchemaConfiguration object", () => {
        const typeDefs = `
        type TestType @query(read:false) {
            name: String
        }
        extend schema @subscription
    `;

        const schemaExtensions = parse(typeDefs).definitions.filter(
            (definition) => definition.kind === Kind.SCHEMA_EXTENSION
        ) as SchemaExtensionNode[];
        const schemaConfiguration = schemaConfigurationFromSchemaExtensions(schemaExtensions);

        expect(schemaConfiguration).toMatchObject({
            subscriptionDirective: new SubscriptionDirective([
                SubscriptionEvent.CREATED,
                SubscriptionEvent.DELETED,
                SubscriptionEvent.UPDATED,
                SubscriptionEvent.RELATIONSHIP_CREATED,
                SubscriptionEvent.RELATIONSHIP_DELETED,
            ]),
        });
    });

    test("getSchemaConfigurationFlags should return the correct flags", () => {
        const typeDefs = `
                type TestType @query(read:false) @mutation(operations: [CREATE, DELETE]) {
                    name: String
                }
                extend schema @subscription(events: [CREATED])
            `;

        const documentNode = parse(typeDefs);
        const schemaExtensions = documentNode.definitions.filter(
            (definition) => definition.kind === Kind.SCHEMA_EXTENSION
        ) as SchemaExtensionNode[];
        const objectTypeDefinition = documentNode.definitions.find(
            (definition) => definition.kind === Kind.OBJECT_TYPE_DEFINITION
        ) as ObjectTypeDefinitionNode;
        const nodeSchemaConfiguration = schemaConfigurationFromObjectTypeDefinition(objectTypeDefinition);
        const globalSchemaConfiguration = schemaConfigurationFromSchemaExtensions(schemaExtensions);
        const schemaConfigurationFlags = getSchemaConfigurationFlags({
            nodeSchemaConfiguration,
            globalSchemaConfiguration,
        });

        expect(schemaConfigurationFlags).toEqual({
            read: false,
            aggregate: false,
            create: true,
            delete: true,
            update: false,
            subscribeCreate: true,
            subscribeCreateRelationship: false,
            subscribeDelete: false,
            subscribeDeleteRelationship: false,
            subscribeUpdate: false,
        });
    });

    test("getSchemaConfigurationFlags should return the correct flags when used with the deprecated exclude directive", () => {
        const typeDefs = `
                type TestType @exclude(operations: [CREATE, DELETE]) {
                    name: String
                }
            `;

        const documentNode = parse(typeDefs);
        const objectTypeDefinition = documentNode.definitions.find(
            (definition) => definition.kind === Kind.OBJECT_TYPE_DEFINITION
        ) as ObjectTypeDefinitionNode;
        const exclude = (objectTypeDefinition.directives as any[])[0];
        const excludeDirective = parseExcludeDirective(exclude);
        const schemaConfigurationFlags = getSchemaConfigurationFlags({
            excludeDirective,
        });

        expect(schemaConfigurationFlags).toEqual({
            read: true,
            aggregate: true,
            create: false,
            delete: false,
            update: true,
            subscribeCreate: true,
            subscribeCreateRelationship: true,
            subscribeDelete: true,
            subscribeDeleteRelationship: true,
            subscribeUpdate: true,
        });
    });
});

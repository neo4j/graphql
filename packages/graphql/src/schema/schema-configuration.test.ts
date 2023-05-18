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
                "CREATE",
                "DELETE",
                "UPDATE",
                "CREATE_RELATIONSHIP",
                "DELETE_RELATIONSHIP",
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
                "CREATE",
                "DELETE",
                "UPDATE",
                "CREATE_RELATIONSHIP",
                "DELETE_RELATIONSHIP",
            ]),
        });
    });

    test("getSchemaConfigurationFlags should return the correct flags", () => {
        const typeDefs = `
                type TestType @query(read:false) @mutation(operations: [CREATE, DELETE]) {
                    name: String
                }
                extend schema @subscription(operations: [CREATE])
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
});

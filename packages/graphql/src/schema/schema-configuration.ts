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
import type { Exclude } from "../classes";
import type { MutationDirective } from "../classes/MutationDirective";
import type { QueryDirective } from "../classes/QueryDirective";
import type { SubscriptionDirective } from "../classes/SubscriptionDirective";
import {
    mutationDirective as mutationDirectiveDefinition,
    queryDirective as queryDirectiveDefinition,
    subscriptionDirective as subscriptionDirectiveDefinition,
} from "../graphql/directives";
import parseMutationDirective from "./parse-mutation-directive";
import parseQueryDirective from "./parse-query-directive";
import parseSubscriptionDirective from "./parse-subscription-directive";

export type SchemaConfiguration = {
    queryDirective?: QueryDirective;
    mutationDirective?: MutationDirective;
    subscriptionDirective?: SubscriptionDirective;
};

export type SchemaConfigurationFlags = {
    read: boolean;
    aggregate: boolean;
    create: boolean;
    delete: boolean;
    update: boolean;
    subscribeCreate: boolean;
    subscribeUpdate: boolean;
    subscribeDelete: boolean;
    subscribeCreateRelationship: boolean;
    subscribeDeleteRelationship: boolean;
};

function getDefaultSchemaConfigurationFlags(): SchemaConfigurationFlags {
    return {
        read: true,
        aggregate: true,
        create: true,
        delete: true,
        update: true,
        subscribeCreate: true,
        subscribeUpdate: true,
        subscribeDelete: true,
        subscribeCreateRelationship: true,
        subscribeDeleteRelationship: true,
    };
}

// obtain a schema configuration object from a list of SchemaExtensionNode
export function schemaConfigurationFromSchemaExtensions(schemaExtensions: SchemaExtensionNode[]): SchemaConfiguration {
    const schemaConfiguration: SchemaConfiguration = {};

    for (const schemaExtension of schemaExtensions) {
        for (const directive of schemaExtension.directives || []) {
            if (directive.name.value === queryDirectiveDefinition.name) {
                if (schemaConfiguration.queryDirective) {
                    throw new Error(`Ambiguous usage with the directive named: ${queryDirectiveDefinition.name}`);
                }
                schemaConfiguration.queryDirective = parseQueryDirective(directive);
            }

            if (directive.name.value === mutationDirectiveDefinition.name) {
                if (schemaConfiguration.mutationDirective) {
                    throw new Error(`Ambiguity usage with the directive named: ${queryDirectiveDefinition.name}`);
                }
                schemaConfiguration.mutationDirective = parseMutationDirective(directive);
            }

            if (directive.name.value === subscriptionDirectiveDefinition.name) {
                if (schemaConfiguration.subscriptionDirective) {
                    throw new Error(`Ambiguous usage with the directive named: ${queryDirectiveDefinition.name}`);
                }
                schemaConfiguration.subscriptionDirective = parseSubscriptionDirective(directive);
            }
        }
    }
    return schemaConfiguration;
}

// obtain a schema configuration object from a ObjectTypeDefinition
export function schemaConfigurationFromObjectTypeDefinition(definition: ObjectTypeDefinitionNode): SchemaConfiguration {
    const schemaConfiguration: SchemaConfiguration = {};

    for (const directive of definition.directives || []) {
        if (directive.name.value === queryDirectiveDefinition.name) {
            schemaConfiguration.queryDirective = parseQueryDirective(directive);
        }

        if (directive.name.value === mutationDirectiveDefinition.name) {
            schemaConfiguration.mutationDirective = parseMutationDirective(directive);
        }

        if (directive.name.value === subscriptionDirectiveDefinition.name) {
            schemaConfiguration.subscriptionDirective = parseSubscriptionDirective(directive);
        }
    }

    return schemaConfiguration;
}

// takes the directives that may mutate the output schema and returns a SchemaConfigurationFlags object
export function getSchemaConfigurationFlags(options: {
    nodeSchemaConfiguration?: SchemaConfiguration;
    globalSchemaConfiguration?: SchemaConfiguration;
    excludeDirective?: Exclude;
}) {
    // avoid mixing between the exclude directive and the new schema configurations one
    if (
        options.excludeDirective &&
        (options.globalSchemaConfiguration?.queryDirective ||
            options.nodeSchemaConfiguration?.queryDirective ||
            options.globalSchemaConfiguration?.mutationDirective ||
            options.nodeSchemaConfiguration?.mutationDirective)
    ) {
        throw new Error(
            "@exclude directive is a deprecated directive and cannot be used in conjunction with @query, @mutation, @subscription"
        );
    }

    // avoid mixing configurations on both schema and object
    if (options.globalSchemaConfiguration?.queryDirective && options.nodeSchemaConfiguration?.queryDirective) {
        throw new Error("@query directive already defined at the schema location");
    }

    if (options.globalSchemaConfiguration?.mutationDirective && options.nodeSchemaConfiguration?.mutationDirective) {
        throw new Error("@mutation directive already defined at the schema location");
    }

    if (
        options.globalSchemaConfiguration?.subscriptionDirective &&
        options.nodeSchemaConfiguration?.subscriptionDirective
    ) {
        throw new Error("@subscription directive already defined at the schema location");
    }

    const schemaConfigurationFlags = getDefaultSchemaConfigurationFlags();

    if (options.excludeDirective) {
        const excludeOperationsSet = new Set(options.excludeDirective.operations);
        schemaConfigurationFlags.read = schemaConfigurationFlags.aggregate = !excludeOperationsSet.has("read");
        schemaConfigurationFlags.create = !excludeOperationsSet.has("create");
        schemaConfigurationFlags.delete = !excludeOperationsSet.has("delete");
        schemaConfigurationFlags.update = !excludeOperationsSet.has("update");
    }

    const queryDirective =
        options.nodeSchemaConfiguration?.queryDirective || options.globalSchemaConfiguration?.queryDirective;
    const mutationDirective =
        options.nodeSchemaConfiguration?.mutationDirective || options.globalSchemaConfiguration?.mutationDirective;
    const subscriptionDirective =
        options.globalSchemaConfiguration?.subscriptionDirective ||
        options.nodeSchemaConfiguration?.subscriptionDirective;

    if (queryDirective) {
        schemaConfigurationFlags.read = queryDirective.read;
        schemaConfigurationFlags.aggregate = queryDirective.aggregate;
    }

    if (mutationDirective) {
        schemaConfigurationFlags.create = mutationDirective.create;
        schemaConfigurationFlags.update = mutationDirective.update;
        schemaConfigurationFlags.delete = mutationDirective.delete;
    }

    if (subscriptionDirective) {
        schemaConfigurationFlags.subscribeCreate = subscriptionDirective.created;
        schemaConfigurationFlags.subscribeUpdate = subscriptionDirective.updated;
        schemaConfigurationFlags.subscribeDelete = subscriptionDirective.deleted;
        schemaConfigurationFlags.subscribeCreateRelationship = subscriptionDirective.relationshipCreated;
        schemaConfigurationFlags.subscribeDeleteRelationship = subscriptionDirective.relationshipDeleted;
    }

    return schemaConfigurationFlags;
}

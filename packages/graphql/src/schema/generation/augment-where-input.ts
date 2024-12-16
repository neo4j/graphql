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

import type {
    Directive,
    InputTypeComposer,
    InputTypeComposerFieldConfigMapDefinition,
    SchemaComposer,
} from "graphql-compose";
import pluralize from "pluralize";
import { DEPRECATED } from "../../constants";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { Neo4jFeaturesSettings } from "../../types";
import { shouldAddDeprecatedFields } from "./utils";

type FieldConfig = {
    name: string;
    typeName: string;
    description: string;
    deprecationReason?: string;
};

export function augmentWhereInputWithRelationshipFilters({
    whereInput,
    composer,
    relationshipAdapter,
    deprecatedDirectives,
    features,
}: {
    whereInput: InputTypeComposer;
    composer: SchemaComposer;
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    deprecatedDirectives: Directive[];
    features?: Neo4jFeaturesSettings;
}) {
    if (!relationshipAdapter.isFilterableByValue()) {
        return {};
    }

    // Relationship filters
    const relationshipFiltersFields = fieldConfigsToFieldConfigMap({
        deprecatedDirectives,
        fields: getRelationshipFilters(relationshipAdapter),
    });

    composer.getOrCreateITC(relationshipAdapter.operations.relationshipFiltersTypeName, (itc) => {
        itc.addFields(relationshipFiltersFields);
    });

    whereInput.addFields({
        [relationshipAdapter.name]: {
            type: relationshipAdapter.operations.relationshipFiltersTypeName,
        },
    });

    // Connection filters
    const connectionFiltersFields = fieldConfigsToFieldConfigMap({
        deprecatedDirectives,
        fields: getRelationshipConnectionFilters(relationshipAdapter),
    });

    composer.getOrCreateITC(relationshipAdapter.operations.connectionFiltersTypeName, (itc) => {
        itc.addFields(connectionFiltersFields);
    });

    whereInput.addFields({
        [relationshipAdapter.operations.connectionFieldName]: {
            type: relationshipAdapter.operations.connectionFiltersTypeName,
        },
    });
    if (shouldAddDeprecatedFields(features, "relationshipFilters")) {
        // Add relationship legacy filter fields
        const legacyRelationship = fieldConfigsToFieldConfigMap({
            deprecatedDirectives,
            fields: getRelationshipFiltersLegacy(relationshipAdapter),
        });
        whereInput.addFields(legacyRelationship);

        // Add connection legacy filter fields
        const legacyConnection = fieldConfigsToFieldConfigMap({
            deprecatedDirectives,
            fields: getRelationshipConnectionFiltersLegacy(relationshipAdapter),
        });
        whereInput.addFields(legacyConnection);
    }
}

function getRelationshipFilters(
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter
): FieldConfig[] {
    return [
        {
            name: "all",
            typeName: relationshipAdapter.target.operations.whereInputTypeName,
            description: `Return ${pluralize(
                relationshipAdapter.source.name
            )} where all of the related ${pluralize(relationshipAdapter.target.name)} match this filter`,
        },

        {
            name: "none",
            typeName: relationshipAdapter.target.operations.whereInputTypeName,
            description: `Return ${pluralize(
                relationshipAdapter.source.name
            )} where none of the related ${pluralize(relationshipAdapter.target.name)} match this filter`,
        },

        {
            name: "single",
            typeName: relationshipAdapter.target.operations.whereInputTypeName,
            description: `Return ${pluralize(
                relationshipAdapter.source.name
            )} where one of the related ${pluralize(relationshipAdapter.target.name)} match this filter`,
        },

        {
            name: "some",
            typeName: relationshipAdapter.target.operations.whereInputTypeName,
            description: `Return ${pluralize(
                relationshipAdapter.source.name
            )} where some of the related ${pluralize(relationshipAdapter.target.name)} match this filter`,
        },
    ];
}

function getRelationshipConnectionFilters(
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter
): FieldConfig[] {
    return [
        {
            name: "all",
            typeName: relationshipAdapter.operations.getConnectionWhereTypename(),
            description: `Return ${pluralize(relationshipAdapter.source.name)} where all of the related ${pluralize(
                relationshipAdapter.operations.connectionFieldTypename
            )} match this filter`,
        },
        {
            name: "none",
            typeName: relationshipAdapter.operations.getConnectionWhereTypename(),
            description: `Return ${pluralize(relationshipAdapter.source.name)} where none of the related ${pluralize(
                relationshipAdapter.operations.connectionFieldTypename
            )} match this filter`,
        },
        {
            name: "single",
            typeName: relationshipAdapter.operations.getConnectionWhereTypename(),
            description: `Return ${pluralize(relationshipAdapter.source.name)} where one of the related ${pluralize(
                relationshipAdapter.operations.connectionFieldTypename
            )} match this filter`,
        },
        {
            name: "some",
            typeName: relationshipAdapter.operations.getConnectionWhereTypename(),
            description: `Return ${pluralize(relationshipAdapter.source.name)} where some of the related ${pluralize(
                relationshipAdapter.operations.connectionFieldTypename
            )} match this filter`,
        },
    ];
}

function getRelationshipFiltersLegacy(
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter
): FieldConfig[] {
    return [
        {
            name: `${relationshipAdapter.name}_ALL`,
            typeName: relationshipAdapter.target.operations.whereInputTypeName,
            description: `Return ${pluralize(
                relationshipAdapter.source.name
            )} where all of the related ${pluralize(relationshipAdapter.target.name)} match this filter`,

            deprecationReason: `Please use the relevant generic filter '${relationshipAdapter.name}: { all: ... }' instead.`,
        },
        {
            name: `${relationshipAdapter.name}_NONE`,
            typeName: relationshipAdapter.target.operations.whereInputTypeName,
            description: `Return ${pluralize(
                relationshipAdapter.source.name
            )} where none of the related ${pluralize(relationshipAdapter.target.name)} match this filter`,

            deprecationReason: `Please use the relevant generic filter '${relationshipAdapter.name}: { none: ... }' instead.`,
        },
        {
            name: `${relationshipAdapter.name}_SINGLE`,
            typeName: relationshipAdapter.target.operations.whereInputTypeName,
            description: `Return ${pluralize(
                relationshipAdapter.source.name
            )} where one of the related ${pluralize(relationshipAdapter.target.name)} match this filter`,

            deprecationReason: `Please use the relevant generic filter '${relationshipAdapter.name}: {  single: ... }' instead.`,
        },
        {
            name: `${relationshipAdapter.name}_SOME`,
            typeName: relationshipAdapter.target.operations.whereInputTypeName,
            description: `Return ${pluralize(
                relationshipAdapter.source.name
            )} where some of the related ${pluralize(relationshipAdapter.target.name)} match this filter`,

            deprecationReason: `Please use the relevant generic filter '${relationshipAdapter.name}: {  some: ... }' instead.`,
        },
    ];
}

function getRelationshipConnectionFiltersLegacy(
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter
): FieldConfig[] {
    return [
        {
            name: `${relationshipAdapter.operations.connectionFieldName}_ALL`,
            typeName: relationshipAdapter.operations.getConnectionWhereTypename(),
            description: `Return ${pluralize(relationshipAdapter.source.name)} where all of the related ${pluralize(
                relationshipAdapter.operations.connectionFieldTypename
            )} match this filter`,
            deprecationReason: `Please use the relevant generic filter '${relationshipAdapter.operations.connectionFieldName}: { all: { node: ... } } }' instead.`,
        },
        {
            name: `${relationshipAdapter.operations.connectionFieldName}_NONE`,
            typeName: relationshipAdapter.operations.getConnectionWhereTypename(),
            description: `Return ${pluralize(relationshipAdapter.source.name)} where none of the related ${pluralize(
                relationshipAdapter.operations.connectionFieldTypename
            )} match this filter`,
            deprecationReason: `Please use the relevant generic filter '${relationshipAdapter.operations.connectionFieldName}: { none: { node: ... } } }' instead.`,
        },
        {
            name: `${relationshipAdapter.operations.connectionFieldName}_SINGLE`,
            typeName: relationshipAdapter.operations.getConnectionWhereTypename(),
            description: `Return ${pluralize(relationshipAdapter.source.name)} where one of the related ${pluralize(
                relationshipAdapter.operations.connectionFieldTypename
            )} match this filter`,
            deprecationReason: `Please use the relevant generic filter '${relationshipAdapter.operations.connectionFieldName}: { single: { node: ... } } }' instead.`,
        },
        {
            name: `${relationshipAdapter.operations.connectionFieldName}_SOME`,
            typeName: relationshipAdapter.operations.getConnectionWhereTypename(),
            description: `Return ${pluralize(relationshipAdapter.source.name)} where some of the related ${pluralize(
                relationshipAdapter.operations.connectionFieldTypename
            )} match this filter`,
            deprecationReason: `Please use the relevant generic filter '${relationshipAdapter.operations.connectionFieldName}: { some: { node: ... } } }' instead.`,
        },
    ];
}

// NOTE: This used to be a specialized function used specifically to generate relationship fields,
// but now after this refactor, it could be used as schema composer utility if needed.
function fieldConfigsToFieldConfigMap({
    deprecatedDirectives,
    fields,
}: {
    deprecatedDirectives: Directive[];
    fields: FieldConfig[];
}): InputTypeComposerFieldConfigMapDefinition {
    const fieldsConfigMap: InputTypeComposerFieldConfigMapDefinition = {};

    for (const field of fields) {
        let directives;
        if (deprecatedDirectives.length) {
            directives = deprecatedDirectives;
        } else if (field.deprecationReason) {
            directives = [{ name: DEPRECATED, args: { reason: field.deprecationReason } }];
        }
        fieldsConfigMap[field.name] = {
            type: field.typeName,
            directives,
            description: field.description,
        };
    }

    return fieldsConfigMap;
}

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

import type { DirectiveNode } from "graphql";
import type { Directive, InputTypeComposerFieldConfigMapDefinition, SchemaComposer } from "graphql-compose";
import { DEPRECATED } from "../constants";
import type { AttributeAdapter } from "../schema-model/attribute/model-adapters/AttributeAdapter";
import { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jFeaturesSettings } from "../types";
import { fieldConfigsToFieldConfigMap, getRelationshipFilters } from "./generation/augment-where-input";
import { getInputFilterFromAttributeType } from "./generation/get-input-filter-from-attribute-type";
import { shouldAddDeprecatedFields } from "./generation/utils";
import { graphqlDirectivesToCompose } from "./to-compose";

// TODO: refactoring needed!
// isWhereField, isFilterable, ... extracted out into attributes category
// even more now as Cypher filters and generic input object are added in the mix
export function getWhereFieldsForAttributes({
    attributes,
    userDefinedFieldDirectives,
    features,
    ignoreCypherFieldFilters,
    composer,
}: {
    attributes: AttributeAdapter[];
    userDefinedFieldDirectives?: Map<string, DirectiveNode[]>;
    features: Neo4jFeaturesSettings | undefined;
    ignoreCypherFieldFilters: boolean;
    composer: SchemaComposer;
}): InputTypeComposerFieldConfigMapDefinition {
    const result: InputTypeComposerFieldConfigMapDefinition = {};

    // Add the where fields for each attribute
    for (const field of attributes) {
        const userDefinedDirectivesOnField = userDefinedFieldDirectives?.get(field.name);
        const deprecatedDirectives = graphqlDirectivesToCompose(
            (userDefinedDirectivesOnField ?? []).filter((directive) => directive.name.value === DEPRECATED)
        );

        if (field.annotations.cypher) {
            // If the field is a cypher field and ignoreCypherFieldFilters is true, skip it
            if (ignoreCypherFieldFilters === true) {
                continue;
            }

            // If the field is a cypher field with arguments, skip it
            if (field.args.length > 0) {
                continue;
            }

            if (field.annotations.cypher.targetEntity) {
                const targetEntityAdapter = new ConcreteEntityAdapter(field.annotations.cypher.targetEntity);
                const type = targetEntityAdapter.operations.whereInputTypeName;

                // Add list where field filters (e.g. name_ALL, name_NONE, name_SINGLE, name_SOME)
                if (field.typeHelper.isList()) {
                    addCypherRelationshipLegacyFilters({
                        field,
                        type,
                        result,
                        deprecatedDirectives,
                    });

                    addCypherRelationshipFilter({ field, type, result, deprecatedDirectives, composer });
                } else {
                    // Add base where field filter (e.g. name)
                    result[field.name] = {
                        type,
                        directives: deprecatedDirectives,
                    };
                }

                continue;
            }
        }

        result[field.name] = {
            type: getInputFilterFromAttributeType(field, features),
            directives: deprecatedDirectives,
        };
        if (!shouldAddDeprecatedFields(features, "attributeFilters")) {
            continue;
        }
        result[`${field.name}_EQ`] = {
            type: field.getInputTypeNames().where.pretty,
            directives: getAttributeDeprecationDirective(deprecatedDirectives, field, "EQ"),
        };

        // If the field is a boolean, skip it
        // This is done here because the previous additions are still added for boolean fields
        if (field.typeHelper.isBoolean()) {
            continue;
        }

        // If the field is an array, add the includes and not includes fields
        // if (field.isArray()) {
        if (field.typeHelper.isList()) {
            result[`${field.name}_INCLUDES`] = {
                type: field.getInputTypeNames().where.type,
                directives: getAttributeDeprecationDirective(deprecatedDirectives, field, "INCLUDES"),
            };

            continue;
        }

        // If the field is not an array, add the in and not in fields
        result[`${field.name}_IN`] = {
            type: field.getFilterableInputTypeName(),
            directives: getAttributeDeprecationDirective(deprecatedDirectives, field, "IN"),
        };

        // If the field is a number or temporal, add the comparison operators
        if (field.isNumericalOrTemporal()) {
            ["LT", "LTE", "GT", "GTE"].forEach((comparator) => {
                result[`${field.name}_${comparator}`] = {
                    type: field.getInputTypeNames().where.type,
                    directives: getAttributeDeprecationDirective(deprecatedDirectives, field, comparator),
                };
            });
            continue;
        }

        // If the field is spatial, add the point comparison operators
        if (field.typeHelper.isSpatial()) {
            ["DISTANCE", "LT", "LTE", "GT", "GTE"].forEach((comparator) => {
                result[`${field.name}_${comparator}`] = {
                    type: `${field.getTypeName()}Distance`,
                    directives: getAttributeDeprecationDirective(deprecatedDirectives, field, comparator),
                };
            });
            continue;
        }

        // If the field is a string, add the string comparison operators
        if (field.typeHelper.isString() || field.typeHelper.isID()) {
            const stringWhereOperators: Array<{ comparator: string; typeName: string }> = [
                { comparator: "CONTAINS", typeName: field.getInputTypeNames().where.type },
                { comparator: "STARTS_WITH", typeName: field.getInputTypeNames().where.type },
                { comparator: "ENDS_WITH", typeName: field.getInputTypeNames().where.type },
            ];

            Object.entries(features?.filters?.[field.getInputTypeNames().where.type] || {}).forEach(
                ([filter, enabled]) => {
                    if (enabled) {
                        if (filter === "MATCHES") {
                            stringWhereOperators.push({ comparator: filter, typeName: "String" });
                        } else {
                            stringWhereOperators.push({
                                comparator: filter,
                                typeName: field.getInputTypeNames().where.type,
                            });
                        }
                    }
                }
            );
            stringWhereOperators.forEach(({ comparator, typeName }) => {
                const excludedComparators = ["CASE_INSENSITIVE"];
                if (!excludedComparators.includes(comparator)) {
                    result[`${field.name}_${comparator}`] = {
                        type: typeName,
                        directives: getAttributeDeprecationDirective(deprecatedDirectives, field, comparator),
                    };
                }
            });
        }
    }

    return result;
}

function getAttributeDeprecationDirective(
    deprecatedDirectives: Directive[],
    field: AttributeAdapter,
    comparator: string
): Directive[] {
    if (deprecatedDirectives.length) {
        return deprecatedDirectives;
    }

    switch (comparator) {
        case "DISTANCE":
        case "LT":
        case "LTE":
        case "GT":
        case "GTE":
        case "CONTAINS":
        case "MATCHES":
        case "IN":
        case "INCLUDES":
        case "EQ": {
            return [
                {
                    name: DEPRECATED,
                    args: {
                        reason: `Please use the relevant generic filter ${field.name}: { ${comparator.toLowerCase()}: ... }`,
                    },
                },
            ];
        }
        case "STARTS_WITH": {
            return [
                {
                    name: DEPRECATED,
                    args: {
                        reason: `Please use the relevant generic filter ${field.name}: { startsWith: ... }`,
                    },
                },
            ];
        }
        case "ENDS_WITH": {
            return [
                {
                    name: DEPRECATED,
                    args: {
                        reason: `Please use the relevant generic filter ${field.name}: { endsWith: ... }`,
                    },
                },
            ];
        }
        default: {
            throw new Error(`Unknown comparator: ${comparator}`);
        }
    }
}

function addCypherRelationshipFilter({
    field,
    type,
    result,
    deprecatedDirectives,
    composer,
}: {
    field: AttributeAdapter;
    type: string;
    result: InputTypeComposerFieldConfigMapDefinition;
    deprecatedDirectives: Directive[];
    composer: SchemaComposer;
}) {
    const targetName = field.annotations.cypher?.targetEntity?.name;
    if (!targetName) {
        throw new Error("Target entity is not defined for the cypher field");
    }

    // Relationship filters
    const relationshipFiltersFields = fieldConfigsToFieldConfigMap({
        deprecatedDirectives: [],
        fields: getRelationshipFilters({
            relationshipInfo: { targetName, inputTypeName: type },
        }),
    });
    // this mimic the adapter RelationshipOperation field "relationshipFiltersTypeName"
    const relationshipType = `${targetName}RelationshipFilters`;

    composer.getOrCreateITC(relationshipType, (itc) => {
        itc.addFields(relationshipFiltersFields);
    });

    result[field.name] = {
        type: relationshipType,
        directives: deprecatedDirectives,
    };
}

function addCypherRelationshipLegacyFilters({
    field,
    type,
    result,
    deprecatedDirectives,
}: {
    field: AttributeAdapter;
    type: string;
    result: InputTypeComposerFieldConfigMapDefinition;
    deprecatedDirectives: Directive[];
}) {
    const quantifiers = ["ALL", "NONE", "SINGLE", "SOME"] as const;
    for (const quantifier of quantifiers) {
        result[`${field.name}_${quantifier}`] = {
            type,
            directives: deprecatedDirectives,
        };
    }
}

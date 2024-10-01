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
import type { Directive } from "graphql-compose";
import { DEPRECATED } from "../constants";
import type { AttributeAdapter } from "../schema-model/attribute/model-adapters/AttributeAdapter";
import type { Neo4jFeaturesSettings } from "../types";
import { DEPRECATE_EQUAL_FILTERS, DEPRECATE_NOT } from "./constants";
import { shouldAddDeprecatedFields } from "./generation/utils";
import { graphqlDirectivesToCompose } from "./to-compose";

// TODO: refactoring needed!
// isWhereField, isFilterable, ... extracted out into attributes category
export function getWhereFieldsForAttributes({
    attributes,
    userDefinedFieldDirectives,
    features,
    ignoreCypherFieldFilters,
}: {
    attributes: AttributeAdapter[];
    userDefinedFieldDirectives?: Map<string, DirectiveNode[]>;
    features: Neo4jFeaturesSettings | undefined;
    ignoreCypherFieldFilters: boolean;
}): Record<
    string,
    {
        type: string;
        directives: Directive[];
    }
> {
    const result: Record<
        string,
        {
            type: string;
            directives: Directive[];
        }
    > = {};
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

            // If it's a list, skip it
            if (field.typeHelper.isList()) {
                continue;
            }
        }

        if (shouldAddDeprecatedFields(features, "implicitEqualFilters")) {
            result[field.name] = {
                type: field.getInputTypeNames().where.pretty,
                directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_EQUAL_FILTERS],
            };
        }
        result[`${field.name}_EQ`] = {
            type: field.getInputTypeNames().where.pretty,
            directives: deprecatedDirectives,
        };

        if (shouldAddDeprecatedFields(features, "negationFilters")) {
            result[`${field.name}_NOT`] = {
                type: field.getInputTypeNames().where.pretty,
                directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
            };
        }
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
                directives: deprecatedDirectives,
            };
            if (shouldAddDeprecatedFields(features, "negationFilters")) {
                result[`${field.name}_NOT_INCLUDES`] = {
                    type: field.getInputTypeNames().where.type,
                    directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
                };
            }
            continue;
        }

        // If the field is not an array, add the in and not in fields
        result[`${field.name}_IN`] = {
            type: field.getFilterableInputTypeName(),
            directives: deprecatedDirectives,
        };
        if (shouldAddDeprecatedFields(features, "negationFilters")) {
            result[`${field.name}_NOT_IN`] = {
                type: field.getFilterableInputTypeName(),
                directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
            };
        }
        // If the field is a number or temporal, add the comparison operators
        if (field.isNumericalOrTemporal()) {
            ["_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                result[`${field.name}${comparator}`] = {
                    type: field.getInputTypeNames().where.type,
                    directives: deprecatedDirectives,
                };
            });
            continue;
        }

        // If the field is spatial, add the point comparison operators
        if (field.typeHelper.isSpatial()) {
            ["_DISTANCE", "_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                result[`${field.name}${comparator}`] = {
                    type: `${field.getTypeName()}Distance`,
                    directives: deprecatedDirectives,
                };
            });
            continue;
        }

        // If the field is a string, add the string comparison operators
        if (field.typeHelper.isString() || field.typeHelper.isID()) {
            const stringWhereOperators: Array<{ comparator: string; typeName: string }> = [
                { comparator: "_CONTAINS", typeName: field.getInputTypeNames().where.type },
                { comparator: "_STARTS_WITH", typeName: field.getInputTypeNames().where.type },
                { comparator: "_ENDS_WITH", typeName: field.getInputTypeNames().where.type },
            ];

            Object.entries(features?.filters?.[field.getInputTypeNames().where.type] || {}).forEach(
                ([filter, enabled]) => {
                    if (enabled) {
                        if (filter === "MATCHES") {
                            stringWhereOperators.push({ comparator: `_${filter}`, typeName: "String" });
                        } else {
                            stringWhereOperators.push({
                                comparator: `_${filter}`,
                                typeName: field.getInputTypeNames().where.type,
                            });
                        }
                    }
                }
            );
            stringWhereOperators.forEach(({ comparator, typeName }) => {
                result[`${field.name}${comparator}`] = { type: typeName, directives: deprecatedDirectives };
            });

            if (shouldAddDeprecatedFields(features, "negationFilters")) {
                ["_NOT_CONTAINS", "_NOT_STARTS_WITH", "_NOT_ENDS_WITH"].forEach((comparator) => {
                    result[`${field.name}${comparator}`] = {
                        type: field.getInputTypeNames().where.type,
                        directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
                    };
                });
            }
        }
    }

    return result;
}

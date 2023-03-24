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
    CustomEnumField,
    CustomScalarField,
    Neo4jFeaturesSettings,
    PointField,
    PrimitiveField,
    TemporalField,
} from "../types";
import { graphqlDirectivesToCompose } from "./to-compose";
import { DEPRECATE_NOT } from "./constants";

interface Fields {
    scalarFields: CustomScalarField[];
    enumFields: CustomEnumField[];
    primitiveFields: PrimitiveField[];
    temporalFields: TemporalField[];
    pointFields: PointField[];
}

function getWhereFields({
    typeName,
    fields,
    isInterface,
    features,
}: {
    typeName: string;
    fields: Fields;
    isInterface?: boolean;
    features?: Neo4jFeaturesSettings;
}): { [k: string]: string } {
    return {
        ...(isInterface ? {} : { OR: `[${typeName}Where!]`, AND: `[${typeName}Where!]`, NOT: `${typeName}Where` }),
        ...[
            ...fields.primitiveFields,
            ...fields.temporalFields,
            ...fields.enumFields,
            ...fields.pointFields,
            ...fields.scalarFields,
        ].reduce((res, f) => {
            const deprecatedDirectives = graphqlDirectivesToCompose(
                f.otherDirectives.filter((directive) => directive.name.value === "deprecated")
            );

            res[f.fieldName] = {
                type: f.typeMeta.input.where.pretty,
                directives: deprecatedDirectives,
            };
            res[`${f.fieldName}_NOT`] = {
                type: f.typeMeta.input.where.pretty,
                directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
            };

            if (f.typeMeta.name === "Boolean") {
                return res;
            }

            if (f.typeMeta.array) {
                res[`${f.fieldName}_INCLUDES`] = {
                    type: f.typeMeta.input.where.type,
                    directives: deprecatedDirectives,
                };
                res[`${f.fieldName}_NOT_INCLUDES`] = {
                    type: f.typeMeta.input.where.type,
                    directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
                };
                return res;
            }

            res[`${f.fieldName}_IN`] = {
                type: `[${f.typeMeta.input.where.pretty}${f.typeMeta.required ? "!" : ""}]`,
                directives: deprecatedDirectives,
            };
            res[`${f.fieldName}_NOT_IN`] = {
                type: `[${f.typeMeta.input.where.pretty}${f.typeMeta.required ? "!" : ""}]`,
                directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
            };

            if (
                [
                    "Float",
                    "Int",
                    "BigInt",
                    "DateTime",
                    "Date",
                    "LocalDateTime",
                    "Time",
                    "LocalTime",
                    "Duration",
                ].includes(f.typeMeta.name)
            ) {
                ["_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                    res[`${f.fieldName}${comparator}`] = { type: f.typeMeta.name, directives: deprecatedDirectives };
                });
                return res;
            }

            if (["Point", "CartesianPoint"].includes(f.typeMeta.name)) {
                ["_DISTANCE", "_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                    res[`${f.fieldName}${comparator}`] = {
                        type: `${f.typeMeta.name}Distance`,
                        directives: deprecatedDirectives,
                    };
                });
                return res;
            }

            if (["String", "ID"].includes(f.typeMeta.name)) {
                const stringWhereOperators: { comparator: string; typeName: string }[] = [
                    { comparator: "_CONTAINS", typeName: f.typeMeta.name },
                    { comparator: "_STARTS_WITH", typeName: f.typeMeta.name },
                    { comparator: "_ENDS_WITH", typeName: f.typeMeta.name },
                ];

                const stringWhereOperatorsNegate = ["_NOT_CONTAINS", "_NOT_STARTS_WITH", "_NOT_ENDS_WITH"];

                Object.entries(features?.filters?.[f.typeMeta.name] || {}).forEach(([filter, enabled]) => {
                    if (enabled) {
                        if (filter === "MATCHES") {
                            stringWhereOperators.push({ comparator: `_${filter}`, typeName: "String" });
                        } else {
                            stringWhereOperators.push({ comparator: `_${filter}`, typeName: f.typeMeta.name });
                        }
                    }
                });
                stringWhereOperators.forEach(({ comparator, typeName }) => {
                    res[`${f.fieldName}${comparator}`] = { type: typeName, directives: deprecatedDirectives };
                });

                stringWhereOperatorsNegate.forEach((comparator) => {
                    res[`${f.fieldName}${comparator}`] = {
                        type: f.typeMeta.name,
                        directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
                    };
                });
                return res;
            }

            return res;
        }, {}),
    };
}

export default getWhereFields;

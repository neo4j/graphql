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
    enableRegex,
    isInterface,
    features,
}: {
    typeName: string;
    fields: Fields;
    enableRegex?: boolean;
    isInterface?: boolean;
    features?: Neo4jFeaturesSettings;
}): { [k: string]: string } {
    return {
        ...(isInterface ? {} : { OR: `[${typeName}Where!]`, AND: `[${typeName}Where!]` }),
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
                directives: deprecatedDirectives,
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
                    directives: deprecatedDirectives,
                };
                return res;
            }

            res[`${f.fieldName}_IN`] = {
                type: `[${f.typeMeta.input.where.pretty}${f.typeMeta.required ? "!" : ""}]`,
                directives: deprecatedDirectives,
            };
            res[`${f.fieldName}_NOT_IN`] = {
                type: `[${f.typeMeta.input.where.pretty}${f.typeMeta.required ? "!" : ""}]`,
                directives: deprecatedDirectives,
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
                if (enableRegex) {
                    res[`${f.fieldName}_MATCHES`] = { type: "String", directives: deprecatedDirectives };
                }

                const stringWhereOperators = [
                    "_CONTAINS",
                    "_NOT_CONTAINS",
                    "_STARTS_WITH",
                    "_NOT_STARTS_WITH",
                    "_ENDS_WITH",
                    "_NOT_ENDS_WITH",
                ];

                Object.entries(features?.filters?.String || {}).forEach(([key, value]) => {
                    if (value) {
                        stringWhereOperators.push(`_${key}`);
                    }
                });
                stringWhereOperators.forEach((comparator) => {
                    res[`${f.fieldName}${comparator}`] = { type: f.typeMeta.name, directives: deprecatedDirectives };
                });
                return res;
            }

            return res;
        }, {}),
    };
}

export default getWhereFields;

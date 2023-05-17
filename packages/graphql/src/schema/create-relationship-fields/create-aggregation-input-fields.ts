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

import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import { upperFirst } from "graphql-compose";
import { Node } from "../../classes";
import {
    AGGREGATION_COMPARISON_OPERATORS,
    WHERE_AGGREGATION_AVERAGE_TYPES,
    WHERE_AGGREGATION_TYPES,
} from "../../constants";
import type { BaseField, RelationField } from "../../types";
import { DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS, DEPRECATE_INVALID_AGGREGATION_FILTERS } from "../constants";
import type { ObjectFields } from "../get-obj-field-meta";

export function createAggregationInputFields(
    nodeOrRelFields: Node | ObjectFields,
    sourceName: string,
    rel: RelationField,
    schemaComposer: SchemaComposer
): InputTypeComposer | undefined {
    const aggregationFields = WHERE_AGGREGATION_TYPES.reduce<BaseField[]>((baseFields, aggregationType) => {
        const fields = [...nodeOrRelFields.primitiveFields, ...nodeOrRelFields.temporalFields].filter(
            (field) => !field.typeMeta.array && field.typeMeta.name === aggregationType
        );

        if (!fields.length) {
            return baseFields;
        }

        return baseFields.concat(fields);
    }, []);

    if (!aggregationFields.length) {
        return;
    }

    const name = `${sourceName}${upperFirst(rel.fieldName)}${
        nodeOrRelFields instanceof Node ? `Node` : `Edge`
    }AggregationWhereInput`;

    const aggregationInput = schemaComposer.createInputTC({
        name,
        fields: {
            AND: `[${name}!]`,
            OR: `[${name}!]`,
            NOT: name,
        },
    });

    aggregationFields.forEach((field) => {
        if (field.typeMeta.name === "ID") {
            aggregationInput.addFields({
                [`${field.fieldName}_EQUAL`]: {
                    type: `ID`,
                    directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
                },
            });

            return;
        }

        if (field.typeMeta.name === "String") {
            aggregationInput.addFields(
                AGGREGATION_COMPARISON_OPERATORS.reduce((res, operator) => {
                    return {
                        ...res,
                        [`${field.fieldName}_${operator}`]: {
                            type: `${operator === "EQUAL" ? "String" : "Int"}`,
                            directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
                        },
                        [`${field.fieldName}_AVERAGE_${operator}`]: {
                            type: "Float",
                            directives: [DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS],
                        },
                        [`${field.fieldName}_LONGEST_${operator}`]: {
                            type: "Int",
                            directives: [DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS],
                        },
                        [`${field.fieldName}_SHORTEST_${operator}`]: {
                            type: "Int",
                            directives: [DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS],
                        },
                        [`${field.fieldName}_AVERAGE_LENGTH_${operator}`]: "Float",
                        [`${field.fieldName}_LONGEST_LENGTH_${operator}`]: "Int",
                        [`${field.fieldName}_SHORTEST_LENGTH_${operator}`]: "Int",
                    };
                }, {})
            );

            return;
        }

        if (WHERE_AGGREGATION_AVERAGE_TYPES.includes(field.typeMeta.name)) {
            aggregationInput.addFields(
                AGGREGATION_COMPARISON_OPERATORS.reduce((res, operator) => {
                    let averageType = "Float";

                    if (field.typeMeta.name === "BigInt") {
                        averageType = "BigInt";
                    }

                    if (field.typeMeta.name === "Duration") {
                        averageType = "Duration";
                    }

                    return {
                        ...res,
                        [`${field.fieldName}_${operator}`]: {
                            type: field.typeMeta.name,
                            directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
                        },
                        [`${field.fieldName}_AVERAGE_${operator}`]: averageType,
                        [`${field.fieldName}_MIN_${operator}`]: field.typeMeta.name,
                        [`${field.fieldName}_MAX_${operator}`]: field.typeMeta.name,
                        ...(field.typeMeta.name !== "Duration"
                            ? { [`${field.fieldName}_SUM_${operator}`]: field.typeMeta.name }
                            : {}),
                    };
                }, {})
            );

            return;
        }

        aggregationInput.addFields(
            AGGREGATION_COMPARISON_OPERATORS.reduce(
                (res, operator) => ({
                    ...res,
                    [`${field.fieldName}_${operator}`]: {
                        type: field.typeMeta.name,
                        directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
                    },
                    [`${field.fieldName}_MIN_${operator}`]: field.typeMeta.name,
                    [`${field.fieldName}_MAX_${operator}`]: field.typeMeta.name,
                }),
                {}
            )
        );
    });

    return aggregationInput;
}

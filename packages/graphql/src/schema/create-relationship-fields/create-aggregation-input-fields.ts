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
import { AGGREGATION_COMPARISON_OPERATORS, WHERE_AGGREGATION_TYPES } from "../../constants";
import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { BaseField, RelationField } from "../../types";
import { DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS, DEPRECATE_INVALID_AGGREGATION_FILTERS } from "../constants";
import type { ObjectFields } from "../get-obj-field-meta";

export function createAggregationInputFields(
    nodeOrRelFields: Node | ObjectFields,
    sourceName: string,
    rel: RelationField,
    schemaComposer: SchemaComposer
): InputTypeComposer | undefined {
    const fields = [...nodeOrRelFields.primitiveFields, ...nodeOrRelFields.temporalFields];

    const aggregationFields: BaseField[] = fields.filter((field) => {
        return !field.typeMeta.array && WHERE_AGGREGATION_TYPES.includes(field.typeMeta.name);
    });

    if (!aggregationFields.length) {
        return;
    }

    const aggregationInputName = `${sourceName}${upperFirst(rel.fieldName)}${
        nodeOrRelFields instanceof Node ? `Node` : `Edge`
    }AggregationWhereInput`;

    const aggregationInput = schemaComposer.createInputTC({
        name: aggregationInputName,
        fields: {
            AND: `[${aggregationInputName}!]`,
            OR: `[${aggregationInputName}!]`,
            NOT: aggregationInputName,
        },
    });

    for (const aggregationField of aggregationFields) {
        if (!aggregationField.filterableOptions.byAggregate) {
            continue;
        }
        switch (aggregationField.typeMeta.name) {
            case "ID":
                createIDAggregationInputFields(aggregationInput, aggregationField);
                break;

            case "String":
                createStringAggregationInputFields(aggregationInput, aggregationField);
                break;

            // Types that you can average
            // https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-avg
            // https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-avg-duration
            // String uses avg(size())
            case "Int":
            case "Float":
            case "BigInt":
            case "Duration":
                createAverageAggregationInputFields(aggregationInput, aggregationField);
                break;

            default:
                createComparisonAggregationInputFields(aggregationInput, aggregationField);
                break;
        }
    }

    return aggregationInput;
}

function createComparisonAggregationInputFields(aggregationInput: InputTypeComposer, field: BaseField) {
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
}

function createAverageAggregationInputFields(aggregationInput: InputTypeComposer, field: BaseField) {
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

function createStringAggregationInputFields(aggregationInput: InputTypeComposer, field: BaseField) {
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

function createIDAggregationInputFields(aggregationInput: InputTypeComposer, field: BaseField) {
    aggregationInput.addFields({
        [`${field.fieldName}_EQUAL`]: {
            type: `ID`,
            directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
        },
    });

    return;
}

export function createAggregationInputFields2(
    entity: ConcreteEntityAdapter | RelationshipAdapter,
    rel: RelationshipAdapter,
    schemaComposer: SchemaComposer
): InputTypeComposer | undefined {
    const aggregationFields = entity.aggregationWhereFields;
    if (!aggregationFields.length) {
        return;
    }

    const aggregationInputName = rel.getAggregationWhereInputTypeName(
        entity instanceof ConcreteEntityAdapter ? `Node` : `Edge`
    );
    const aggregationInput = schemaComposer.createInputTC({
        name: aggregationInputName,
        fields: {
            AND: `[${aggregationInputName}!]`,
            OR: `[${aggregationInputName}!]`,
            NOT: aggregationInputName,
        },
    });

    for (const aggregationField of aggregationFields) {
        switch (aggregationField.getTypeName()) {
            case "ID":
                createIDAggregationInputFields2(aggregationInput, aggregationField);
                break;

            case "String":
                createStringAggregationInputFields2(aggregationInput, aggregationField);
                break;

            // Types that you can average
            // https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-avg
            // https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-avg-duration
            // String uses avg(size())
            case "Int":
            case "Float":
            case "BigInt":
            case "Duration":
                createAverageAggregationInputFields2(aggregationInput, aggregationField);
                break;

            default:
                createComparisonAggregationInputFields2(aggregationInput, aggregationField);
                break;
        }
    }

    return aggregationInput;
}

function createComparisonAggregationInputFields2(aggregationInput: InputTypeComposer, field: AttributeAdapter) {
    aggregationInput.addFields(
        AGGREGATION_COMPARISON_OPERATORS.reduce(
            (res, operator) => ({
                ...res,
                [`${field.name}_${operator}`]: {
                    type: field.getTypeName(),
                    directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
                },
                [`${field.name}_MIN_${operator}`]: field.getTypeName(),
                [`${field.name}_MAX_${operator}`]: field.getTypeName(),
            }),
            {}
        )
    );
}

function createAverageAggregationInputFields2(aggregationInput: InputTypeComposer, field: AttributeAdapter) {
    aggregationInput.addFields(
        AGGREGATION_COMPARISON_OPERATORS.reduce((res, operator) => {
            let averageType = "Float";

            if (field.getTypeName() === "BigInt") {
                averageType = "BigInt";
            }

            if (field.getTypeName() === "Duration") {
                averageType = "Duration";
            }

            return {
                ...res,
                [`${field.name}_${operator}`]: {
                    type: field.getTypeName(),
                    directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
                },
                [`${field.name}_AVERAGE_${operator}`]: averageType,
                [`${field.name}_MIN_${operator}`]: field.getTypeName(),
                [`${field.name}_MAX_${operator}`]: field.getTypeName(),
                ...(field.getTypeName() !== "Duration"
                    ? { [`${field.name}_SUM_${operator}`]: field.getTypeName() }
                    : {}),
            };
        }, {})
    );

    return;
}

function createStringAggregationInputFields2(aggregationInput: InputTypeComposer, field: AttributeAdapter) {
    aggregationInput.addFields(
        AGGREGATION_COMPARISON_OPERATORS.reduce((res, operator) => {
            return {
                ...res,
                [`${field.name}_${operator}`]: {
                    type: `${operator === "EQUAL" ? "String" : "Int"}`,
                    directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
                },
                [`${field.name}_AVERAGE_${operator}`]: {
                    type: "Float",
                    directives: [DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS],
                },
                [`${field.name}_LONGEST_${operator}`]: {
                    type: "Int",
                    directives: [DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS],
                },
                [`${field.name}_SHORTEST_${operator}`]: {
                    type: "Int",
                    directives: [DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS],
                },
                [`${field.name}_AVERAGE_LENGTH_${operator}`]: "Float",
                [`${field.name}_LONGEST_LENGTH_${operator}`]: "Int",
                [`${field.name}_SHORTEST_LENGTH_${operator}`]: "Int",
            };
        }, {})
    );

    return;
}

function createIDAggregationInputFields2(aggregationInput: InputTypeComposer, field: AttributeAdapter) {
    aggregationInput.addFields({
        [`${field.name}_EQUAL`]: {
            type: `ID`,
            directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
        },
    });

    return;
}

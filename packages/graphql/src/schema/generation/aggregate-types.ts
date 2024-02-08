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
import { GraphQLFloat, GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import type {
    InputTypeComposer,
    InputTypeComposerFieldConfigMapDefinition,
    ObjectTypeComposer,
    ObjectTypeComposerFieldConfigMapDefinition,
    SchemaComposer,
} from "graphql-compose";
import { AGGREGATION_COMPARISON_OPERATORS } from "../../constants";
import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { AggregationTypesMapper } from "../aggregations/aggregation-types-mapper";
import { DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS, DEPRECATE_INVALID_AGGREGATION_FILTERS } from "../constants";
import { numericalResolver } from "../resolvers/field/numerical";
import { graphqlDirectivesToCompose } from "../to-compose";

export function withAggregateSelectionType({
    entityAdapter,
    aggregationTypesMapper,
    propagatedDirectives,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    aggregationTypesMapper: AggregationTypesMapper;
    propagatedDirectives: DirectiveNode[];
    composer: SchemaComposer;
}): ObjectTypeComposer {
    const aggregateSelection = composer.createObjectTC({
        name: entityAdapter.operations.aggregateTypeNames.selection,
        fields: {
            count: {
                type: new GraphQLNonNull(GraphQLInt),
                resolve: numericalResolver,
                args: {},
            },
        },
        directives: graphqlDirectivesToCompose(propagatedDirectives),
    });
    aggregateSelection.addFields(makeAggregableFields({ entityAdapter, aggregationTypesMapper }));
    return aggregateSelection;
}

function makeAggregableFields({
    entityAdapter,
    aggregationTypesMapper,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    aggregationTypesMapper: AggregationTypesMapper;
}): ObjectTypeComposerFieldConfigMapDefinition<any, any> {
    const aggregableFields: ObjectTypeComposerFieldConfigMapDefinition<any, any> = {};
    const aggregableAttributes = entityAdapter.aggregableFields;
    for (const attribute of aggregableAttributes) {
        const objectTypeComposer = aggregationTypesMapper.getAggregationType(attribute.getTypeName());
        if (objectTypeComposer) {
            aggregableFields[attribute.name] = objectTypeComposer.NonNull;
        }
    }
    return aggregableFields;
}

export function withAggregateInputType({
    relationshipAdapter,
    entityAdapter, // TODO: this is relationshipAdapter.target but from the context above it is known to be ConcreteEntity and we don't know this yet!!!
    composer,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    entityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer {
    const aggregateInputTypeName = relationshipAdapter.operations.aggregateInputTypeName;
    if (composer.has(aggregateInputTypeName)) {
        return composer.getITC(aggregateInputTypeName);
    }
    const aggregateSelection = composer.createInputTC({
        name: aggregateInputTypeName,
        fields: {
            count: GraphQLInt,
            count_LT: GraphQLInt,
            count_LTE: GraphQLInt,
            count_GT: GraphQLInt,
            count_GTE: GraphQLInt,
        },
    });
    aggregateSelection.addFields({
        AND: aggregateSelection.NonNull.List,
        OR: aggregateSelection.NonNull.List,
        NOT: aggregateSelection,
    });

    const nodeWhereInputType = withAggregationWhereInputType({
        relationshipAdapter,
        entityAdapter,
        composer,
    });
    if (nodeWhereInputType) {
        aggregateSelection.addFields({ node: nodeWhereInputType });
    }
    const edgeWhereInputType = withAggregationWhereInputType({
        relationshipAdapter,
        entityAdapter: relationshipAdapter,
        composer,
    });
    if (edgeWhereInputType) {
        aggregateSelection.addFields({ edge: edgeWhereInputType });
    }
    return aggregateSelection;
}

function withAggregationWhereInputType({
    relationshipAdapter,
    entityAdapter,
    composer,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    entityAdapter: ConcreteEntityAdapter | RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const aggregationInputName =
        entityAdapter instanceof ConcreteEntityAdapter
            ? relationshipAdapter.operations.nodeAggregationWhereInputTypeName
            : relationshipAdapter.operations.edgeAggregationWhereInputTypeName;
    if (composer.has(aggregationInputName)) {
        return composer.getITC(aggregationInputName);
    }
    if (entityAdapter instanceof RelationshipDeclarationAdapter) {
        return;
    }
    const aggregationFields = entityAdapter.aggregationWhereFields;
    if (!aggregationFields.length) {
        return;
    }
    const aggregationInput = composer.createInputTC({
        name: aggregationInputName,
        fields: {},
    });
    aggregationInput.addFields({
        AND: aggregationInput.NonNull.List,
        OR: aggregationInput.NonNull.List,
        NOT: aggregationInput,
    });
    aggregationInput.addFields(makeAggregationFields(aggregationFields));
    return aggregationInput;
}

function makeAggregationFields(attributes: AttributeAdapter[]): InputTypeComposerFieldConfigMapDefinition {
    const aggregationFields = attributes
        .map((attribute) => getAggregationFieldsByType(attribute))
        .reduce((acc, el) => ({ ...acc, ...el }), {});
    return aggregationFields;
}

// TODO: refactor this by introducing specialized Adapters
function getAggregationFieldsByType(attribute: AttributeAdapter): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (attribute.typeHelper.isID()) {
        fields[`${attribute.name}_EQUAL`] = {
            type: GraphQLID,
            directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
        };
        return fields;
    }
    if (attribute.typeHelper.isString()) {
        for (const operator of AGGREGATION_COMPARISON_OPERATORS) {
            fields[`${attribute.name}_${operator}`] = {
                type: `${operator === "EQUAL" ? GraphQLString : GraphQLInt}`,
                directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
            };
            fields[`${attribute.name}_AVERAGE_${operator}`] = {
                type: GraphQLFloat,
                directives: [DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS],
            };
            fields[`${attribute.name}_LONGEST_${operator}`] = {
                type: GraphQLInt,
                directives: [DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS],
            };
            fields[`${attribute.name}_SHORTEST_${operator}`] = {
                type: GraphQLInt,
                directives: [DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS],
            };
            fields[`${attribute.name}_AVERAGE_LENGTH_${operator}`] = GraphQLFloat;
            fields[`${attribute.name}_LONGEST_LENGTH_${operator}`] = GraphQLInt;
            fields[`${attribute.name}_SHORTEST_LENGTH_${operator}`] = GraphQLInt;
        }
        return fields;
    }
    if (attribute.typeHelper.isNumeric() || attribute.typeHelper.isDuration()) {
        // Types that you can average
        // https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-avg
        // https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-avg-duration
        // String uses avg(size())
        for (const operator of AGGREGATION_COMPARISON_OPERATORS) {
            fields[`${attribute.name}_${operator}`] = {
                type: attribute.getTypeName(),
                directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
            };
            fields[`${attribute.name}_MIN_${operator}`] = attribute.getTypeName();
            fields[`${attribute.name}_MAX_${operator}`] = attribute.getTypeName();
            if (attribute.getTypeName() !== "Duration") {
                fields[`${attribute.name}_SUM_${operator}`] = attribute.getTypeName();
            }
            const averageType = attribute.typeHelper.isBigInt()
                ? "BigInt"
                : attribute.typeHelper.isDuration()
                ? "Duration"
                : GraphQLFloat;
            fields[`${attribute.name}_AVERAGE_${operator}`] = averageType;
        }
        return fields;
    }
    for (const operator of AGGREGATION_COMPARISON_OPERATORS) {
        fields[`${attribute.name}_${operator}`] = {
            type: attribute.getTypeName(),
            directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
        };
        fields[`${attribute.name}_MIN_${operator}`] = attribute.getTypeName();
        fields[`${attribute.name}_MAX_${operator}`] = attribute.getTypeName();
    }
    return fields;
}

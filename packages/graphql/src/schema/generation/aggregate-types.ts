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
import { GraphQLFloat, GraphQLInt, GraphQLNonNull } from "graphql";
import type {
    InputTypeComposer,
    InputTypeComposerFieldConfigMapDefinition,
    ObjectTypeComposer,
    ObjectTypeComposerFieldConfigMapDefinition,
    SchemaComposer,
} from "graphql-compose";
import { AGGREGATION_COMPARISON_OPERATORS } from "../../constants";
import { ConnectionAggregationCountFilterInput } from "../../graphql/input-objects/generic-aggregation-filters/CountScalarAggregationFilters";
import { IntScalarFilters } from "../../graphql/input-objects/generic-operators/IntScalarFilters";
import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { Neo4jFeaturesSettings } from "../../types";
import type { AggregationTypesMapper } from "../aggregations/aggregation-types-mapper";
import { DEPRECATE_AGGREGATION_FILTERS, DEPRECATE_AGGREGATION_INPUT_FILTERS } from "../constants";
import { numericalResolver } from "../resolvers/field/numerical";
import { graphqlDirectivesToCompose } from "../to-compose";
import { getAggregationFilterFromAttributeType } from "./get-aggregation-filter-from-attribute-type";
import { shouldAddDeprecatedFields } from "./utils";

export function withAggregateSelectionType({
    entityAdapter,
    aggregationTypesMapper,
    propagatedDirectives,
    composer,
    features,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    aggregationTypesMapper: AggregationTypesMapper;
    propagatedDirectives: DirectiveNode[];
    composer: SchemaComposer;
    features: Neo4jFeaturesSettings | undefined;
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
    aggregateSelection.addFields(makeAggregableFields({ entityAdapter, aggregationTypesMapper, features }));

    createConnectionAggregate({
        entityAdapter,
        aggregationTypesMapper,
        propagatedDirectives,
        composer,
        features,
    });
    return aggregateSelection;
}

/** Create aggregate field inside connections */
function createConnectionAggregate({
    entityAdapter,
    aggregationTypesMapper,
    propagatedDirectives,
    composer,
    features,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    aggregationTypesMapper: AggregationTypesMapper;
    propagatedDirectives: DirectiveNode[];
    composer: SchemaComposer;
    features: Neo4jFeaturesSettings | undefined;
}): ObjectTypeComposer {
    const aggregableFields = makeAggregableFields({ entityAdapter, aggregationTypesMapper, features });
    let aggregateNode: ObjectTypeComposer | undefined;
    const hasNodeAggregateFields = Object.keys(aggregableFields).length > 0;
    if (hasNodeAggregateFields) {
        aggregateNode = composer.createObjectTC({
            name: entityAdapter.operations.aggregateTypeNames.node,
            fields: {},
            directives: graphqlDirectivesToCompose(propagatedDirectives),
        });
        aggregateNode.addFields(aggregableFields);
    }

    const connectionAggregate = composer.createObjectTC({
        name: entityAdapter.operations.aggregateTypeNames.connection,
        fields: {
            count: aggregationTypesMapper.getCountType().NonNull,
        },
        directives: graphqlDirectivesToCompose(propagatedDirectives),
    });

    if (aggregateNode) {
        connectionAggregate.addFields({
            node: aggregateNode.NonNull,
        });
    }

    return connectionAggregate;
}

function makeAggregableFields({
    entityAdapter,
    aggregationTypesMapper,
    features,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    aggregationTypesMapper: AggregationTypesMapper;
    features: Neo4jFeaturesSettings | undefined;
}): ObjectTypeComposerFieldConfigMapDefinition<any, any> {
    const aggregableFields: ObjectTypeComposerFieldConfigMapDefinition<any, any> = {};
    const aggregableAttributes = entityAdapter.aggregableFields;
    for (const attribute of aggregableAttributes) {
        const objectTypeComposer = aggregationTypesMapper.getAggregationType(attribute.getTypeName());
        if (objectTypeComposer) {
            aggregableFields[attribute.name] = { type: objectTypeComposer.NonNull };
        }
    }
    return aggregableFields;
}

export function withConnectionAggregateInputType({
    relationshipAdapter,
    entityAdapter,
    composer,
    userDefinedDirectivesOnTargetFields,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    composer: SchemaComposer;
    userDefinedDirectivesOnTargetFields: Map<string, DirectiveNode[]> | undefined;
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposer {
    const aggregateInputTypeName = relationshipAdapter.operations.connectionAggregateInputTypeName;
    if (composer.has(aggregateInputTypeName)) {
        return composer.getITC(aggregateInputTypeName);
    }

    const aggregateWhereInput = composer.createInputTC({
        name: aggregateInputTypeName,
        fields: {
            count: ConnectionAggregationCountFilterInput,
        },
    });

    aggregateWhereInput.addFields({
        AND: aggregateWhereInput.NonNull.List,
        OR: aggregateWhereInput.NonNull.List,
        NOT: aggregateWhereInput,
    });

    const nodeWhereInputType = withAggregationWhereInputType({
        relationshipAdapter,
        entityAdapter,
        composer,
        userDefinedDirectivesOnTargetFields,
        features,
    });
    if (nodeWhereInputType) {
        aggregateWhereInput.addFields({ node: nodeWhereInputType });
    }
    const edgeWhereInputType = withAggregationWhereInputType({
        relationshipAdapter,
        entityAdapter: relationshipAdapter,
        composer,
        userDefinedDirectivesOnTargetFields,
        features,
    });
    if (edgeWhereInputType) {
        aggregateWhereInput.addFields({ edge: edgeWhereInputType });
    }
    return aggregateWhereInput;
}

/**
 * Deprecated Aggregation filters, for the Aggregation inside Connection input see withConnectionAggregateInputType
 **/
export function withAggregateInputType({
    relationshipAdapter,
    entityAdapter, // TODO: this is relationshipAdapter.target but from the context above it is known to be ConcreteEntity and we don't know this yet!!!
    composer,
    userDefinedDirectivesOnTargetFields,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
    composer: SchemaComposer;
    userDefinedDirectivesOnTargetFields: Map<string, DirectiveNode[]> | undefined;
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposer {
    const aggregateInputTypeName = relationshipAdapter.operations.aggregateInputTypeName;
    if (composer.has(aggregateInputTypeName)) {
        return composer.getITC(aggregateInputTypeName);
    }

    const aggregateWhereInput = composer.createInputTC({
        name: aggregateInputTypeName,
        fields: {
            count_EQ: {
                type: GraphQLInt,
                directives: [DEPRECATE_AGGREGATION_INPUT_FILTERS("count", "EQ")],
            },
            count_LT: {
                type: GraphQLInt,
                directives: [DEPRECATE_AGGREGATION_INPUT_FILTERS("count", "LT")],
            },
            count_LTE: {
                type: GraphQLInt,
                directives: [DEPRECATE_AGGREGATION_INPUT_FILTERS("count", "LTE")],
            },
            count_GT: {
                type: GraphQLInt,
                directives: [DEPRECATE_AGGREGATION_INPUT_FILTERS("count", "GT")],
            },
            count_GTE: {
                type: GraphQLInt,
                directives: [DEPRECATE_AGGREGATION_INPUT_FILTERS("count", "GTE")],
            },
            count: IntScalarFilters,
        },
    });

    aggregateWhereInput.addFields({
        AND: aggregateWhereInput.NonNull.List,
        OR: aggregateWhereInput.NonNull.List,
        NOT: aggregateWhereInput,
    });

    const nodeWhereInputType = withAggregationWhereInputType({
        relationshipAdapter,
        entityAdapter,
        composer,
        userDefinedDirectivesOnTargetFields,
        features,
    });
    if (nodeWhereInputType) {
        aggregateWhereInput.addFields({ node: nodeWhereInputType });
    }
    const edgeWhereInputType = withAggregationWhereInputType({
        relationshipAdapter,
        entityAdapter: relationshipAdapter,
        composer,
        userDefinedDirectivesOnTargetFields,
        features,
    });
    if (edgeWhereInputType) {
        aggregateWhereInput.addFields({ edge: edgeWhereInputType });
    }
    return aggregateWhereInput;
}

function withAggregationWhereInputType({
    relationshipAdapter,
    entityAdapter,
    composer,
    userDefinedDirectivesOnTargetFields,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    entityAdapter:
        | ConcreteEntityAdapter
        | RelationshipAdapter
        | RelationshipDeclarationAdapter
        | InterfaceEntityAdapter;
    composer: SchemaComposer;
    userDefinedDirectivesOnTargetFields: Map<string, DirectiveNode[]> | undefined;
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposer | undefined {
    const aggregationInputName =
        entityAdapter instanceof ConcreteEntityAdapter || entityAdapter instanceof InterfaceEntityAdapter
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

    const aggrFields = makeAggregationFields(aggregationFields, userDefinedDirectivesOnTargetFields, features);
    aggregationInput.addFields(aggrFields);
    return aggregationInput;
}

function makeAggregationFields(
    attributes: AttributeAdapter[],
    userDefinedDirectivesOnTargetFields: Map<string, DirectiveNode[]> | undefined,
    features: Neo4jFeaturesSettings | undefined
): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const attribute of attributes) {
        if (shouldAddDeprecatedFields(features, "aggregationFilters")) {
            addDeprecatedAggregationFieldsByType(
                attribute,
                userDefinedDirectivesOnTargetFields?.get(attribute.name),
                fields
            );
        }
        if (attribute.isAggregationWhereField()) {
            fields[attribute.name] = getAggregationFilterFromAttributeType(attribute);
        }
    }
    return fields;
}

// TODO: refactor this by introducing specialized Adapters
function addDeprecatedAggregationFieldsByType(
    attribute: AttributeAdapter,
    directivesOnField: DirectiveNode[] | undefined,
    fields: InputTypeComposerFieldConfigMapDefinition
): InputTypeComposerFieldConfigMapDefinition {
    if (attribute.typeHelper.isString()) {
        for (const operator of AGGREGATION_COMPARISON_OPERATORS) {
            fields[`${attribute.name}_AVERAGE_LENGTH_${operator}`] = {
                type: GraphQLFloat,
                directives: [DEPRECATE_AGGREGATION_FILTERS(attribute.name, "averageLength", operator)],
            };
            fields[`${attribute.name}_LONGEST_LENGTH_${operator}`] = {
                type: GraphQLInt,
                directives: [DEPRECATE_AGGREGATION_FILTERS(attribute.name, "longestLength", operator)],
            };
            fields[`${attribute.name}_SHORTEST_LENGTH_${operator}`] = {
                type: GraphQLInt,
                directives: [DEPRECATE_AGGREGATION_FILTERS(attribute.name, "shortestLength", operator)],
            };
        }

        return fields;
    }
    if (attribute.typeHelper.isNumeric() || attribute.typeHelper.isDuration()) {
        // Types that you can average
        // https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-avg
        // https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-avg-duration
        // String uses avg(size())
        for (const operator of AGGREGATION_COMPARISON_OPERATORS) {
            fields[`${attribute.name}_MIN_${operator}`] = {
                type: attribute.getTypeName(),
                directives: [DEPRECATE_AGGREGATION_FILTERS(attribute.name, "min", operator)],
            };
            fields[`${attribute.name}_MAX_${operator}`] = {
                type: attribute.getTypeName(),
                directives: [DEPRECATE_AGGREGATION_FILTERS(attribute.name, "max", operator)],
            };
            if (attribute.getTypeName() !== "Duration") {
                fields[`${attribute.name}_SUM_${operator}`] = {
                    type: attribute.getTypeName(),
                    directives: [DEPRECATE_AGGREGATION_FILTERS(attribute.name, "sum", operator)],
                };
            }
            const averageType = attribute.typeHelper.isBigInt()
                ? "BigInt"
                : attribute.typeHelper.isDuration()
                  ? "Duration"
                  : GraphQLFloat;
            fields[`${attribute.name}_AVERAGE_${operator}`] = {
                type: averageType,
                directives: [DEPRECATE_AGGREGATION_FILTERS(attribute.name, "average", operator)],
            };
        }

        return fields;
    }
    for (const operator of AGGREGATION_COMPARISON_OPERATORS) {
        fields[`${attribute.name}_MIN_${operator}`] = {
            type: attribute.getTypeName(),
            directives: [DEPRECATE_AGGREGATION_FILTERS(attribute.name, "min", operator)],
        };
        fields[`${attribute.name}_MAX_${operator}`] = {
            type: attribute.getTypeName(),
            directives: [DEPRECATE_AGGREGATION_FILTERS(attribute.name, "max", operator)],
        };
    }
    return fields;
}

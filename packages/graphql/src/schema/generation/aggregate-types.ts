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
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { AggregationTypesMapper } from "../aggregations/aggregation-types-mapper";
import { DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS, DEPRECATE_INVALID_AGGREGATION_FILTERS } from "../constants";
import { numericalResolver } from "../resolvers/field/numerical";
import { graphqlDirectivesToCompose } from "../to-compose";

export function withAggregateSelectionType({
    concreteEntityAdapter,
    aggregationTypesMapper,
    propagatedDirectives,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    aggregationTypesMapper: AggregationTypesMapper;
    propagatedDirectives: DirectiveNode[];
    composer: SchemaComposer;
}): ObjectTypeComposer {
    const aggregateSelection = composer.createObjectTC({
        name: concreteEntityAdapter.operations.aggregateTypeNames.selection,
        fields: {
            count: {
                type: new GraphQLNonNull(GraphQLInt),
                resolve: numericalResolver,
                args: {},
            },
        },
        directives: graphqlDirectivesToCompose(propagatedDirectives),
    });
    aggregateSelection.addFields(makeAggregableFields({ concreteEntityAdapter, aggregationTypesMapper }));
    return aggregateSelection;
}

function makeAggregableFields({
    concreteEntityAdapter,
    aggregationTypesMapper,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    aggregationTypesMapper: AggregationTypesMapper;
}): ObjectTypeComposerFieldConfigMapDefinition<any, any> {
    const aggregableFields: ObjectTypeComposerFieldConfigMapDefinition<any, any> = {};
    const aggregableAttributes = concreteEntityAdapter.aggregableFields;
    for (const attribute of aggregableAttributes) {
        const objectTypeComposer = aggregationTypesMapper.getAggregationType({
            fieldName: attribute.getTypeName(),
            nullable: !attribute.isRequired(),
        });
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
    relationshipAdapter: RelationshipAdapter;
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
    relationshipAdapter: RelationshipAdapter;
    entityAdapter: ConcreteEntityAdapter | RelationshipAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const aggregationFields = entityAdapter.aggregationWhereFields;
    if (!aggregationFields.length) {
        return;
    }
    const aggregationInputName = relationshipAdapter.operations.getAggregationWhereInputTypeName(
        entityAdapter instanceof ConcreteEntityAdapter ? `Node` : `Edge`
    );
    if (composer.has(aggregationInputName)) {
        return composer.getITC(aggregationInputName);
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

// TODO: refactor this ALE
function getAggregationFieldsByType(attribute: AttributeAdapter): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (attribute.isID()) {
        fields[`${attribute.name}_EQUAL`] = {
            type: GraphQLID,
            directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
        };
        return fields;
    }
    if (attribute.isString()) {
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
    if (attribute.isNumeric() || attribute.isDuration()) {
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
            const averageType = attribute.isBigInt() ? "BigInt" : attribute.isDuration() ? "Duration" : GraphQLFloat;
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

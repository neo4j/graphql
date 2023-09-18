import type { DirectiveNode } from "graphql";
import { GraphQLInt, GraphQLNonNull } from "graphql";
import type { ObjectTypeComposer, ObjectTypeComposerFieldConfigMapDefinition, SchemaComposer } from "graphql-compose";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { AggregationTypesMapper } from "../aggregations/aggregation-types-mapper";
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

import type { DirectiveNode } from "graphql";
import { GraphQLID } from "graphql";
import type { InputTypeComposer, InputTypeComposerFieldConfigMapDefinition, SchemaComposer } from "graphql-compose";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jFeaturesSettings } from "../../types";
import { getWhereFieldsForAttributes } from "../get-where-fields";
import { makeImplementationsWhereInput } from "./implementation-inputs";

export function withUniqueWhereInputType({
    concreteEntityAdapter,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter; // required
    composer: SchemaComposer;
}): InputTypeComposer {
    const uniqueWhereFields: InputTypeComposerFieldConfigMapDefinition = {};
    for (const attribute of concreteEntityAdapter.uniqueFields) {
        uniqueWhereFields[attribute.name] = attribute.getFieldTypeName();
    }
    const uniqueWhereInputType = composer.createInputTC({
        name: concreteEntityAdapter.operations.uniqueWhereInputTypeName,
        fields: uniqueWhereFields,
    });
    return uniqueWhereInputType;
}

export function withWhereInputType({
    entityAdapter,
    userDefinedFieldDirectives,
    features,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter | RelationshipAdapter; // required
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    features: Neo4jFeaturesSettings | undefined;
    composer: SchemaComposer;
}): InputTypeComposer {
    const whereInputType = makeWhereInput({ entityAdapter, userDefinedFieldDirectives, features, composer });

    if (entityAdapter instanceof ConcreteEntityAdapter) {
        whereInputType.addFields({
            OR: `[${entityAdapter.operations.whereInputTypeName}!]`,
            AND: `[${entityAdapter.operations.whereInputTypeName}!]`,
            NOT: entityAdapter.operations.whereInputTypeName,
        });
        if (entityAdapter.isGlobalNode()) {
            whereInputType.addFields({ id: GraphQLID });
        }
    } else if (entityAdapter instanceof RelationshipAdapter) {
        whereInputType.addFields({
            OR: `[${entityAdapter.operations.whereInputTypeName}!]`,
            AND: `[${entityAdapter.operations.whereInputTypeName}!]`,
            NOT: entityAdapter.operations.whereInputTypeName,
        });
    } else if (entityAdapter instanceof InterfaceEntityAdapter) {
        const implementationsWhereInputType = makeImplementationsWhereInput({
            interfaceEntityAdapter: entityAdapter,
            composer,
        });
        whereInputType.addFields({ _on: implementationsWhereInputType });
    }
    return whereInputType;
}

function makeWhereInput({
    entityAdapter,
    userDefinedFieldDirectives,
    features,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter | RelationshipAdapter; // required
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    features: Neo4jFeaturesSettings | undefined;
    composer: SchemaComposer;
}): InputTypeComposer {
    const whereFields = makeWhereFields({ entityAdapter, userDefinedFieldDirectives, features });
    const whereInputType = composer.createInputTC({
        name: entityAdapter.operations.whereInputTypeName,
        fields: whereFields,
    });
    return whereInputType;
}

function makeWhereFields({
    entityAdapter,
    userDefinedFieldDirectives,
    features,
}: {
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter | RelationshipAdapter; // required
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposerFieldConfigMapDefinition {
    if (entityAdapter instanceof UnionEntityAdapter) {
        const fields: InputTypeComposerFieldConfigMapDefinition = {};
        for (const concreteEntity of entityAdapter.concreteEntities) {
            fields[concreteEntity.name] = concreteEntity.operations.whereInputTypeName;
        }
        return fields;
    }
    // TODO: make a a category for these including filtering logic from getWhereFieldsForAttributes
    const filterableAttributes = Array.from(entityAdapter.attributes.values());
    return getWhereFieldsForAttributes({
        attributes: filterableAttributes,
        userDefinedFieldDirectives,
        features,
    });
}

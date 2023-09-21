import type { DirectiveNode } from "graphql";
import { GraphQLID } from "graphql";
import type { InputTypeComposer, InputTypeComposerFieldConfigMapDefinition, SchemaComposer } from "graphql-compose";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jFeaturesSettings } from "../../types";
import { DEPRECATE_NOT } from "../constants";
import { getWhereFieldsForAttributes } from "../get-where-fields";
import { makeImplementationsWhereInput } from "./implementation-inputs";

export function withUniqueWhereInputType({
    concreteEntityAdapter,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
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
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter | RelationshipAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    features: Neo4jFeaturesSettings | undefined;
    composer: SchemaComposer;
}): InputTypeComposer {
    if (composer.has(entityAdapter.operations.whereInputTypeName)) {
        return composer.getITC(entityAdapter.operations.whereInputTypeName);
    }
    const whereInputType = makeWhereInput({ entityAdapter, userDefinedFieldDirectives, features, composer });

    if (entityAdapter instanceof ConcreteEntityAdapter) {
        whereInputType.addFields({
            OR: whereInputType.NonNull.List,
            AND: whereInputType.NonNull.List,
            NOT: whereInputType,
        });
        if (entityAdapter.isGlobalNode()) {
            whereInputType.addFields({ id: GraphQLID });
        }
    } else if (entityAdapter instanceof RelationshipAdapter) {
        whereInputType.addFields({
            OR: whereInputType.NonNull.List,
            AND: whereInputType.NonNull.List,
            NOT: whereInputType,
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
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter | RelationshipAdapter;
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
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter | RelationshipAdapter;
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

    return getWhereFieldsForAttributes({
        attributes: entityAdapter.whereFields,
        userDefinedFieldDirectives,
        features,
    });
}

// TODO: make another one of these for non-union ConnectionWhereInputType
export function makeConnectionWhereInputType({
    relationshipAdapter,
    memberEntity,
    composer,
}: {
    relationshipAdapter: RelationshipAdapter;
    memberEntity: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer {
    if (composer.has(relationshipAdapter.operations.getConnectionWhereTypename(memberEntity))) {
        return composer.getITC(relationshipAdapter.operations.getConnectionWhereTypename(memberEntity));
    }
    const connectionWhereInputType = composer.createInputTC({
        name: relationshipAdapter.operations.getConnectionWhereTypename(memberEntity),
        fields: {
            node: memberEntity.operations.whereInputTypeName,
            node_NOT: {
                type: memberEntity.operations.whereInputTypeName,
                directives: [DEPRECATE_NOT],
            },
        },
    });
    connectionWhereInputType.addFields({
        AND: connectionWhereInputType.NonNull.List,
        OR: connectionWhereInputType.NonNull.List,
        NOT: connectionWhereInputType,
    });
    if (relationshipAdapter.propertiesTypeName) {
        connectionWhereInputType.addFields({
            edge: relationshipAdapter.operations.whereInputTypeName,
            edge_NOT: {
                type: relationshipAdapter.operations.whereInputTypeName,
                directives: [DEPRECATE_NOT],
            },
        });
    }
    return connectionWhereInputType;
}

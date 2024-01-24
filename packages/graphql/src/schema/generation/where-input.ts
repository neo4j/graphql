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
import { GraphQLID } from "graphql";
import type {
    Directive,
    InputTypeComposer,
    InputTypeComposerFieldConfigMapDefinition,
    SchemaComposer,
} from "graphql-compose";
import type { EntityAdapter } from "../../schema-model/entity/EntityAdapter";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jFeaturesSettings } from "../../types";
import { DEPRECATE_NOT } from "../constants";
import { getWhereFieldsForAttributes } from "../get-where-fields";
import { withAggregateInputType } from "./aggregate-types";
import { augmentWhereInputTypeWithRelationshipFields } from "./augment-where-input";

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
    experimental,
}: {
    entityAdapter: EntityAdapter | RelationshipAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    features: Neo4jFeaturesSettings | undefined;
    composer: SchemaComposer;
    experimental: boolean;
}): InputTypeComposer {
    if (composer.has(entityAdapter.operations.whereInputTypeName)) {
        return composer.getITC(entityAdapter.operations.whereInputTypeName);
    }
    const whereFields = makeWhereFields({ entityAdapter, userDefinedFieldDirectives, features });
    const whereInputType = composer.createInputTC({
        name: entityAdapter.operations.whereInputTypeName,
        fields: whereFields,
    });

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
        whereInputType.addFields({
            OR: whereInputType.NonNull.List,
            AND: whereInputType.NonNull.List,
            NOT: whereInputType,
        });

        if (entityAdapter.concreteEntities.length > 0) {
            const enumValues = Object.fromEntries(
                entityAdapter.concreteEntities.map((concreteEntity) => [
                    concreteEntity.name,
                    { value: concreteEntity.name },
                ])
            );

            const interfaceImplementation = composer.createEnumTC({
                name: entityAdapter.operations.implementationEnumTypename,
                values: enumValues,
            });
            whereInputType.addFields({ typename_IN: { type: interfaceImplementation.NonNull.List } });
        }
    }
    return whereInputType;
}

function makeWhereFields({
    entityAdapter,
    userDefinedFieldDirectives,
    features,
}: {
    entityAdapter: EntityAdapter | RelationshipAdapter;
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

export function withSourceWhereInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
}): InputTypeComposer | undefined {
    const relationshipTarget = relationshipAdapter.target;
    if (relationshipTarget instanceof InterfaceEntityAdapter) {
        throw new Error("Unexpected interface target");
    }
    const relationshipSource = relationshipAdapter.source;
    const whereInput = composer.getITC(relationshipSource.operations.whereInputTypeName);
    const fields = augmentWhereInputTypeWithRelationshipFields(relationshipAdapter, deprecatedDirectives);
    whereInput.addFields(fields);

    // TODO: Current unions are not supported as relationship targets beyond the above fields
    if (relationshipTarget instanceof UnionEntityAdapter) {
        return;
    }

    const whereAggregateInput = withAggregateInputType({
        relationshipAdapter,
        entityAdapter: relationshipTarget,
        composer: composer,
    });

    if (relationshipAdapter.isFilterableByAggregate()) {
        whereInput.addFields({
            [relationshipAdapter.operations.aggregateTypeName]: {
                type: whereAggregateInput,
                directives: deprecatedDirectives,
            },
        });
    }

    return whereInput;
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
    const typeName = relationshipAdapter.operations.getConnectionWhereTypename(memberEntity);
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const connectionWhereInputType = composer.createInputTC({
        name: typeName,
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

export function withConnectWhereFieldInputType(
    relationshipTarget: ConcreteEntityAdapter | InterfaceEntityAdapter,
    composer: SchemaComposer
): InputTypeComposer {
    const connectWhereName = relationshipTarget.operations.connectWhereInputTypeName;
    if (composer.has(connectWhereName)) {
        return composer.getITC(connectWhereName);
    }
    const connectWhereType = composer.createInputTC({
        name: connectWhereName,
        fields: { node: `${relationshipTarget.operations.whereInputTypeName}!` },
    });

    return connectWhereType;
}

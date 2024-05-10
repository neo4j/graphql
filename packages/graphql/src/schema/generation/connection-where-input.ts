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

import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import type {
    InputTypeComposer,
    InputTypeComposerFieldConfigMapDefinition,
    ObjectTypeComposer,
    SchemaComposer,
} from "graphql-compose";
import { PageInfo } from "../../graphql/objects/PageInfo";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { Neo4jFeaturesSettings } from "../../types";
import { DEPRECATE_NOT } from "../constants";
import { shouldAddDeprecatedFields } from "./utils";

// tODO: refactor into smaller fns for unions, like disconnect-input
export function makeConnectionWhereInputType({
    relationshipAdapter,
    composer,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposer {
    const typeName = relationshipAdapter.operations.getConnectionWhereTypename();
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const targetEntityAdapter = relationshipAdapter.target;
    if (targetEntityAdapter instanceof UnionEntityAdapter) {
        const connectionWhereITC = composer.createInputTC(typeName);
        targetEntityAdapter.concreteEntities.forEach((concreteEntity) => {
            const unionWhereITC = withConnectionWhereInputType({
                relationshipAdapter,
                memberEntity: concreteEntity,
                composer,
                features,
            });

            connectionWhereITC.addFields({
                [concreteEntity.name]: unionWhereITC,
            });
        });
        return connectionWhereITC;
    }
    return withConnectionWhereInputType({
        relationshipAdapter,
        composer,
        features,
    });
}

export function withConnectionWhereInputType({
    relationshipAdapter,
    memberEntity,
    composer,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    memberEntity?: ConcreteEntityAdapter;
    composer: SchemaComposer;
    features: Neo4jFeaturesSettings | undefined;
}): InputTypeComposer {
    const typeName = relationshipAdapter.operations.getConnectionWhereTypename(memberEntity);
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const targetEntity = memberEntity || (relationshipAdapter.target as ConcreteEntityAdapter);
    const connectionWhereInputType = composer.createInputTC({
        name: typeName,
        fields: {},
    });
    connectionWhereInputType.addFields({
        AND: connectionWhereInputType.NonNull.List,
        OR: connectionWhereInputType.NonNull.List,
        NOT: connectionWhereInputType,
        node: targetEntity.operations.whereInputTypeName,
    });

    if (shouldAddDeprecatedFields(features, "negationFilters")) {
        connectionWhereInputType.addFields({
            node_NOT: {
                type: targetEntity.operations.whereInputTypeName,
                directives: [DEPRECATE_NOT],
            },
        });
    }
    if (relationshipAdapter.hasAnyProperties) {
        connectionWhereInputType.addFields({
            edge: relationshipAdapter.operations.whereInputTypeName,
        });

        if (shouldAddDeprecatedFields(features, "negationFilters")) {
            connectionWhereInputType.addFields({
                edge_NOT: {
                    type: relationshipAdapter.operations.whereInputTypeName,
                    directives: [DEPRECATE_NOT],
                },
            });
        }
    }

    return connectionWhereInputType;
}

function shouldGenerateConnectionSortInput(
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter
): boolean {
    if (relationshipAdapter.hasAnyProperties) {
        return true;
    }
    if (!(relationshipAdapter.target instanceof UnionEntityAdapter)) {
        return true;
    }
    return false;
}

export function withConnectionSortInputType({
    relationshipAdapter,
    composer,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    if (!shouldGenerateConnectionSortInput(relationshipAdapter)) {
        return;
    }
    const typeName = relationshipAdapter.operations.connectionSortInputTypename;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const fields = makeConnectionSortInputTypeFields({ relationshipAdapter });
    if (!fields) {
        return;
    }

    const connectionSortITC = composer.createInputTC({
        name: typeName,
        fields,
    });
    return connectionSortITC;
}

function makeConnectionSortInputTypeFields({
    relationshipAdapter,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
}): InputTypeComposerFieldConfigMapDefinition | undefined {
    const targetIsInterfaceWithSortableFields =
        relationshipAdapter.target instanceof InterfaceEntityAdapter &&
        relationshipAdapter.target.sortableFields.length;

    const targetIsConcreteWithSortableFields =
        relationshipAdapter.target instanceof ConcreteEntityAdapter && relationshipAdapter.target.sortableFields.length;

    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (targetIsInterfaceWithSortableFields || targetIsConcreteWithSortableFields) {
        fields["node"] = relationshipAdapter.target.operations.sortInputTypeName;
    }

    /*
        We include all properties here to maintain existing behaviour.
        In future sorting by arrays should become an aggregation sort because it sorts by the length of the array.
    */
    if (relationshipAdapter.hasAnyProperties) {
        fields["edge"] = relationshipAdapter.operations.sortInputTypeName;
    }

    if (Object.keys(fields).length === 0) {
        return undefined;
    }
    return fields;
}

function withRelationshipObjectType({
    relationshipAdapter,
    composer,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
}): ObjectTypeComposer {
    const typeName = relationshipAdapter.operations.relationshipFieldTypename;
    if (composer.has(typeName)) {
        return composer.getOTC(typeName);
    }
    const relationshipObjectType = composer.createObjectTC({
        name: typeName,
        fields: { cursor: new GraphQLNonNull(GraphQLString), node: `${relationshipAdapter.target.name}!` },
    });

    // TODO: RelationshipDeclarationAdapter is handled by doForRelationshipDeclaration - improve
    if (relationshipAdapter instanceof RelationshipAdapter && relationshipAdapter.hasAnyProperties) {
        relationshipObjectType.addFields({
            properties: composer.getOTC(relationshipAdapter.propertiesTypeName).NonNull,
        });
    }
    return relationshipObjectType;
}

export function withConnectionObjectType({
    relationshipAdapter,
    composer,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
}): ObjectTypeComposer {
    const typeName = relationshipAdapter.operations.connectionFieldTypename;
    if (composer.has(typeName)) {
        return composer.getOTC(typeName);
    }
    const connectionObjectType = composer.createObjectTC({
        name: typeName,
        fields: {
            edges: withRelationshipObjectType({ relationshipAdapter, composer }).NonNull.List.NonNull,
            totalCount: new GraphQLNonNull(GraphQLInt),
            pageInfo: new GraphQLNonNull(PageInfo),
        },
    });
    return connectionObjectType;
}

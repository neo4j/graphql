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
import type { ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import { PageInfo } from "../../graphql/objects/PageInfo";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";

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
    const connectionObjectType = composer.getOrCreateOTC(typeName);

    if (relationshipAdapter.isReadable()) {
        connectionObjectType.addFields({
            edges: withRelationshipObjectType({ relationshipAdapter, composer }).NonNull.List.NonNull,
            totalCount: new GraphQLNonNull(GraphQLInt),
            pageInfo: new GraphQLNonNull(PageInfo),
        });
    }

    const isTargetUnion = relationshipAdapter.target instanceof UnionEntityAdapter;
    const isSourceInterface = relationshipAdapter.source instanceof InterfaceEntityAdapter;

    if (relationshipAdapter.aggregate && !isTargetUnion && !isSourceInterface) {
        const connectionObjectType = composer.getOrCreateOTC(typeName);
        connectionObjectType.addFields({
            aggregate: composer.getOTC(relationshipAdapter.operations.getAggregateFieldTypename()).NonNull,
        });
    }

    return connectionObjectType;
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

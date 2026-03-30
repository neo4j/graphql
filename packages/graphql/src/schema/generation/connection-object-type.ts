/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
        const edgeType = withRelationshipObjectType({ relationshipAdapter, composer });

        connectionObjectType.addFields({
            edges: edgeType.NonNull.List.NonNull,
            totalCount: new GraphQLNonNull(GraphQLInt),
            pageInfo: new GraphQLNonNull(PageInfo),
        });
    }

    const isTargetUnion = relationshipAdapter.target instanceof UnionEntityAdapter;
    const isSourceInterface = relationshipAdapter.source instanceof InterfaceEntityAdapter;

    if (relationshipAdapter.isList && relationshipAdapter.aggregate && !isTargetUnion && !isSourceInterface) {
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

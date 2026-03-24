/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLFloat, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import type { InputTypeComposer, ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import { SCORE_FIELD } from "../../constants";
import { SortDirection } from "../../graphql/enums/SortDirection";
import { FloatWhere } from "../../graphql/input-objects/FloatWhere";
import { PageInfo } from "../../graphql/objects/PageInfo";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";

export function withFulltextWhereInputType({
    composer,
    concreteEntityAdapter,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}): InputTypeComposer {
    const typeName = concreteEntityAdapter.operations.fulltextTypeNames.where;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const whereInput = composer.createInputTC({
        name: typeName,
        description: `The input for filtering a full-text query on an index of ${concreteEntityAdapter.name}`,
        fields: {
            [SCORE_FIELD]: FloatWhere.name,
            ["node"]: concreteEntityAdapter.operations.whereInputTypeName,
        },
    });
    return whereInput;
}

export function withFulltextSortInputType({
    composer,
    concreteEntityAdapter,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}): InputTypeComposer {
    const typeName = concreteEntityAdapter.operations.fulltextTypeNames.sort;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const whereInput = composer.createInputTC({
        name: typeName,
        description: `The input for sorting a Fulltext query on an index of ${concreteEntityAdapter.name}`,
        fields: {
            [SCORE_FIELD]: SortDirection.name,
            node: concreteEntityAdapter.operations.sortInputTypeName,
        },
    });
    return whereInput;
}

export function withFulltextResultTypeConnection({
    composer,
    concreteEntityAdapter,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}): ObjectTypeComposer {
    const typeName = concreteEntityAdapter.operations.fulltextTypeNames.connection;
    if (composer.has(typeName)) {
        return composer.getOTC(typeName);
    }

    const edge = composer.createObjectTC({
        name: concreteEntityAdapter.operations.fulltextTypeNames.edge,
        fields: {
            cursor: new GraphQLNonNull(GraphQLString),
            node: `${concreteEntityAdapter.name}!`,
            [SCORE_FIELD]: new GraphQLNonNull(GraphQLFloat),
        },
    });

    const connection = composer.createObjectTC({
        name: typeName,
        fields: {
            totalCount: new GraphQLNonNull(GraphQLInt),
            pageInfo: new GraphQLNonNull(PageInfo),
            edges: edge.NonNull.List.NonNull,
        },
    });

    return connection;
}

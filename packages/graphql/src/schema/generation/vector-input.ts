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

import { GraphQLFloat, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import type { InputTypeComposer, ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import { SCORE_FIELD } from "../../constants";
import { SortDirection } from "../../graphql/enums/SortDirection";
import { FloatWhere } from "../../graphql/input-objects/FloatWhere";
import { PageInfo } from "../../graphql/objects/PageInfo";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";

export function withVectorWhereInputType({
    composer,
    concreteEntityAdapter,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}): InputTypeComposer {
    const typeName = concreteEntityAdapter.operations.vectorTypeNames.where;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const whereInput = composer.createInputTC({
        name: typeName,
        description: `The input for filtering a Vector query on an index of ${concreteEntityAdapter.name}`,
        fields: {
            [SCORE_FIELD]: FloatWhere.name,
            ["node"]: concreteEntityAdapter.operations.whereInputTypeName,
        },
    });
    return whereInput;
}

export function withVectorSortInputType({
    composer,
    concreteEntityAdapter,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}): InputTypeComposer {
    const typeName = concreteEntityAdapter.operations.vectorTypeNames.sort;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const whereInput = composer.createInputTC({
        name: typeName,
        description: `The input for sorting a Vector query on an index of ${concreteEntityAdapter.name}`,
        fields: {
            [SCORE_FIELD]: SortDirection.name,
            node: concreteEntityAdapter.operations.sortInputTypeName,
        },
    });
    return whereInput;
}

export function withVectorResultTypeConnection({
    composer,
    concreteEntityAdapter,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}): ObjectTypeComposer {
    const typeName = concreteEntityAdapter.operations.vectorTypeNames.result;
    if (composer.has(typeName)) {
        return composer.getOTC(typeName);
    }

    const edge = composer.createObjectTC({
        name: concreteEntityAdapter.operations.vectorTypeNames.edge,
        fields: {
            cursor: new GraphQLNonNull(GraphQLString),
            node: `${concreteEntityAdapter.name}!`,
            [SCORE_FIELD]: new GraphQLNonNull(GraphQLFloat),
        },
    });

    const connection = composer.createObjectTC({
        name: concreteEntityAdapter.operations.vectorTypeNames.connection,
        fields: {
            totalCount: new GraphQLNonNull(GraphQLInt),
            pageInfo: new GraphQLNonNull(PageInfo),
            edges: edge.NonNull.List.NonNull,
        },
    });

    const result = composer.createObjectTC({
        name: typeName,
        fields: {
            [concreteEntityAdapter.operations.rootTypeFieldNames.connection]: connection.NonNull,
        },
    });
    return result;
}

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

import { GraphQLFloat, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";
import type {
    InputTypeComposer,
    InputTypeComposerFieldConfigMapDefinition,
    ObjectTypeComposer,
    SchemaComposer,
} from "graphql-compose";
import { SCORE_FIELD } from "../../constants";
import { SortDirection } from "../../graphql/enums/SortDirection";
import { FloatWhere } from "../../graphql/input-objects/FloatWhere";
import type { VectorField } from "../../schema-model/annotation/VectorAnnotation";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";

export function withVectorInputType({
    concreteEntityAdapter,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const typeName = concreteEntityAdapter.operations.vectorInputTypeName;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const fields = makeVectorInputFields({ concreteEntityAdapter, composer });
    const vectorInputType = composer.createInputTC({
        name: typeName,
        fields,
    });
    return vectorInputType;
}

function makeVectorInputFields({
    concreteEntityAdapter,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (!concreteEntityAdapter.annotations.vector) {
        throw new Error("Expected vector annotation");
    }
    for (const index of concreteEntityAdapter.annotations.vector.indexes) {
        if (index.indexName === undefined) {
            throw new Error("The name of the vector index should be defined using the indexName argument.");
        }
        const fieldInput = withVectorIndexInputType({
            concreteEntityAdapter,
            index,
            composer,
        });
        if (fieldInput) {
            fields[index.indexName] = fieldInput;
        }
    }
    return fields;
}

function withVectorIndexInputType({
    composer,
    concreteEntityAdapter,
    index,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
    index: VectorField;
}): InputTypeComposer {
    const typeName = concreteEntityAdapter.operations.getVectorIndexInputTypeName(index.indexName);
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }

    // If there is a provider, we will ask for the phrase
    // If there is a callback, we will ask for the phrase
    if (index.provider !== undefined || index.callback !== undefined) {
        return composer.createInputTC({
            name: typeName,
            fields: {
                phrase: new GraphQLNonNull(GraphQLString),
            },
        });
    }

    // If there is no provider, or callback, we will ask for the List of Floats
    return composer.createInputTC({
        name: typeName,
        fields: {
            vector: new GraphQLList(new GraphQLNonNull(GraphQLFloat)),
        },
    });
}

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
            [concreteEntityAdapter.singular]: concreteEntityAdapter.operations.whereInputTypeName,
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
            [concreteEntityAdapter.singular]: concreteEntityAdapter.operations.sortInputTypeName,
        },
    });
    return whereInput;
}

export function withVectorResultType({
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
    const whereInput = composer.createObjectTC({
        name: typeName,
        description: `The result of a Vector search on an index of ${concreteEntityAdapter.name}`,
        fields: {
            [SCORE_FIELD]: new GraphQLNonNull(GraphQLFloat),
            [concreteEntityAdapter.singular]: `${concreteEntityAdapter.name}!`,
        },
    });
    return whereInput;
}

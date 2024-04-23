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

import { GraphQLFloat, GraphQLNonNull, GraphQLString } from "graphql";
import type {
    InputTypeComposer,
    InputTypeComposerFieldConfigMapDefinition,
    ObjectTypeComposer,
    SchemaComposer,
} from "graphql-compose";
import { SCORE_FIELD } from "../../constants";
import { SortDirection } from "../../graphql/enums/SortDirection";
import { FloatWhere } from "../../graphql/input-objects/FloatWhere";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";

export function withGenAIInputType({
    concreteEntityAdapter,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const typeName = concreteEntityAdapter.operations.genAIInputTypeName;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const fields = makeGenAIInputFields({ concreteEntityAdapter, composer });
    const genAIInputType = composer.createInputTC({
        name: typeName,
        fields,
    });
    return genAIInputType;
}

function makeGenAIInputFields({
    concreteEntityAdapter,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (!concreteEntityAdapter.annotations.genAI) {
        throw new Error("Expected genAI annotation");
    }
    for (const index of concreteEntityAdapter.annotations.genAI.indexes) {
        if (index.indexName === undefined) {
            throw new Error("The name of the vector index should be defined using the indexName argument.");
        }
        const fieldInput = withGenAIIndexInputType({
            concreteEntityAdapter,
            indexName: index.indexName,
            composer,
        });
        if (fieldInput) {
            fields[index.indexName] = fieldInput;
        }
    }
    return fields;
}

function withGenAIIndexInputType({
    composer,
    concreteEntityAdapter,
    indexName,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
    indexName: string;
}): InputTypeComposer {
    const typeName = concreteEntityAdapter.operations.getGenAIIndexInputTypeName(indexName);
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const indexInput = composer.createInputTC({
        name: typeName,
        fields: {
            phrase: new GraphQLNonNull(GraphQLString),
        },
    });
    return indexInput;
}

export function withGenAIWhereInputType({
    composer,
    concreteEntityAdapter,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}): InputTypeComposer {
    const typeName = concreteEntityAdapter.operations.genAITypeNames.where;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const whereInput = composer.createInputTC({
        name: typeName,
        description: `The input for filtering a GenAI query on an index of ${concreteEntityAdapter.name}`,
        fields: {
            [SCORE_FIELD]: FloatWhere.name,
            [concreteEntityAdapter.singular]: concreteEntityAdapter.operations.whereInputTypeName,
        },
    });
    return whereInput;
}

export function withGenAISortInputType({
    composer,
    concreteEntityAdapter,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}): InputTypeComposer {
    const typeName = concreteEntityAdapter.operations.genAITypeNames.sort;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const whereInput = composer.createInputTC({
        name: typeName,
        description: `The input for sorting a GenAI query on an index of ${concreteEntityAdapter.name}`,
        fields: {
            [SCORE_FIELD]: SortDirection.name,
            [concreteEntityAdapter.singular]: concreteEntityAdapter.operations.sortInputTypeName,
        },
    });
    return whereInput;
}

export function withGenAIResultType({
    composer,
    concreteEntityAdapter,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}): ObjectTypeComposer {
    const typeName = concreteEntityAdapter.operations.genAITypeNames.result;
    if (composer.has(typeName)) {
        return composer.getOTC(typeName);
    }
    const whereInput = composer.createObjectTC({
        name: typeName,
        description: `The result of a GenAI search on an index of ${concreteEntityAdapter.name}`,
        fields: {
            [SCORE_FIELD]: new GraphQLNonNull(GraphQLFloat),
            [concreteEntityAdapter.singular]: `${concreteEntityAdapter.name}!`,
        },
    });
    return whereInput;
}

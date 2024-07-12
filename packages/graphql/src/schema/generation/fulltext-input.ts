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

export function withFullTextInputType({
    concreteEntityAdapter,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const typeName = concreteEntityAdapter.operations.fullTextInputTypeName;
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }
    const fields = makeFullTextInputFields({ concreteEntityAdapter, composer });
    const fulltextInputType = composer.createInputTC({
        name: typeName,
        fields,
    });
    return fulltextInputType;
}

function makeFullTextInputFields({
    concreteEntityAdapter,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (!concreteEntityAdapter.annotations.fulltext) {
        throw new Error("Expected fulltext annotation");
    }
    for (const index of concreteEntityAdapter.annotations.fulltext.indexes) {
        const indexName = index.indexName || index.name;
        if (indexName === undefined) {
            throw new Error("The name of the fulltext index should be defined using the indexName argument.");
        }
        const fieldInput = withFullTextIndexInputType({
            concreteEntityAdapter,
            indexName,
            composer,
        });
        if (fieldInput) {
            fields[indexName] = fieldInput;
        }
    }
    return fields;
}

function withFullTextIndexInputType({
    composer,
    concreteEntityAdapter,
    indexName,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
    indexName: string;
}): InputTypeComposer {
    const typeName = concreteEntityAdapter.operations.getFullTextIndexInputTypeName(indexName);
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

export function withFullTextWhereInputType({
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
        description: `The input for filtering a fulltext query on an index of ${concreteEntityAdapter.name}`,
        fields: {
            [SCORE_FIELD]: FloatWhere.name,
            [concreteEntityAdapter.singular]: concreteEntityAdapter.operations.whereInputTypeName,
        },
    });
    return whereInput;
}

export function withFullTextSortInputType({
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
        description: `The input for sorting a fulltext query on an index of ${concreteEntityAdapter.name}`,
        fields: {
            [SCORE_FIELD]: SortDirection.name,
            [concreteEntityAdapter.singular]: concreteEntityAdapter.operations.sortInputTypeName,
        },
    });
    return whereInput;
}

export function withFullTextResultType({
    composer,
    concreteEntityAdapter,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}): ObjectTypeComposer {
    const typeName = concreteEntityAdapter.operations.fulltextTypeNames.result;
    if (composer.has(typeName)) {
        return composer.getOTC(typeName);
    }
    const whereInput = composer.createObjectTC({
        name: typeName,
        description: `The result of a fulltext search on an index of ${concreteEntityAdapter.name}`,
        fields: {
            [SCORE_FIELD]: new GraphQLNonNull(GraphQLFloat),
            [concreteEntityAdapter.singular]: `${concreteEntityAdapter.name}!`,
        },
    });
    return whereInput;
}

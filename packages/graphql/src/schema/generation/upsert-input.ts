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
import { type InputTypeComposer, type SchemaComposer } from "graphql-compose";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { getOnCreateNodeITC, getOnUpdateNodeITC } from "../create-relationship-fields/create-connect-or-create-field";

export function withUpsertInputType({
    entityAdapter,
    userDefinedFieldDirectives,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    composer: SchemaComposer;
}): InputTypeComposer {
    if (composer.has(entityAdapter.operations.upsertInputTypeName)) {
        return composer.getITC(entityAdapter.operations.upsertInputTypeName);
    }

    const onCreateInput = getOnCreateNodeITC({
        schemaComposer: composer,
        entityAdapter,
        userDefinedFieldDirectives,
    });

    const onUpdateInput = getOnUpdateNodeITC({
        schemaComposer: composer,
        entityAdapter,
        userDefinedFieldDirectives,
    });

    const upsertInputType = composer.createInputTC({
        name: entityAdapter.operations.upsertInputTypeName,
        fields: {
            node: onCreateInput.NonNull,
            onCreate: onUpdateInput,
            onUpdate: onUpdateInput,
        },
    });

    return upsertInputType;
}

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

import type { InputTypeComposer, ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";

export function makeConnectionGroupByType({
    entityAdapter,
    composer,
    edgeType,
}: {
    entityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
    edgeType: ObjectTypeComposer;
}): { type: ObjectTypeComposer; args: Record<string, InputTypeComposer> } | undefined {
    const typeName = entityAdapter.operations.getConnectionGroupByTypename();
    const groupByFields = entityAdapter.groupByFields;

    if (groupByFields.length === 0) {
        return undefined;
    }

    const inputArgs = getInputArgs({ entityAdapter, composer });

    if (composer.has(typeName)) {
        return { type: composer.getOTC(typeName), args: inputArgs };
    }

    const connectionGroupByOTC = composer.createObjectTC(typeName);
    connectionGroupByOTC.addFields({
        edges: edgeType.NonNull.List.NonNull,
    });

    return { type: connectionGroupByOTC, args: inputArgs };
}

function getInputArgs({ entityAdapter, composer }: { entityAdapter: ConcreteEntityAdapter; composer: SchemaComposer }) {
    const inputType = makeConnectionGroupByInputType({ entityAdapter, composer });
    return {
        fields: inputType,
    };
}

function makeConnectionGroupByInputType({
    entityAdapter,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer {
    const typeName = entityAdapter.operations.getConnectionGroupByInputTypename();
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }

    const groupByFields = entityAdapter.groupByFields;

    const connectionGroupByITC = composer.createInputTC(typeName);
    for (const attribute of groupByFields) {
        connectionGroupByITC.addFields({
            [attribute.name]: "Boolean",
        });
    }

    return connectionGroupByITC;
}

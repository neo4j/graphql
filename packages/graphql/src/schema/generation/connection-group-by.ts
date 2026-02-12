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

import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";

export function makeConnectionGroupByInputType({
    entityAdapter,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    const typeName = entityAdapter.operations.getConnectionGroupByInputTypename();
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }

    const groupByFields = entityAdapter.groupByFields;

    if (groupByFields.length === 0) {
        return undefined;
    }

    const connectionGroupByITC = composer.createInputTC(typeName);
    for (const attribute of groupByFields) {
        connectionGroupByITC.addFields({
            [attribute.name]: "Boolean",
        });
    }

    return connectionGroupByITC;
}

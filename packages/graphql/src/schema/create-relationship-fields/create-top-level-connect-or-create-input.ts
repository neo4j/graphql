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
import { upperFirst } from "graphql-compose";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationField } from "../../types";

export function createTopLevelConnectOrCreateInput({
    schemaComposer,
    sourceName,
    rel,
}: {
    schemaComposer: SchemaComposer;
    sourceName: string;
    rel: RelationField;
}): void {
    const nodeConnectOrCreateInput: InputTypeComposer<any> = schemaComposer.getOrCreateITC(
        `${sourceName}ConnectOrCreateInput`
    );

    const nodeFieldConnectOrCreateInputName = `${rel.connectionPrefix}${upperFirst(
        rel.fieldName
    )}ConnectOrCreateFieldInput`;

    nodeConnectOrCreateInput.addFields({
        [rel.fieldName]: rel.typeMeta.array
            ? `[${nodeFieldConnectOrCreateInputName}!]`
            : nodeFieldConnectOrCreateInputName,
    });
}

export function createTopLevelConnectOrCreateInput2({
    schemaComposer,
    sourceName,
    relationshipAdapter,
}: {
    schemaComposer: SchemaComposer;
    sourceName: string;
    relationshipAdapter: RelationshipAdapter;
}): void {
    const nodeConnectOrCreateInput: InputTypeComposer<any> = schemaComposer.getOrCreateITC(
        `${sourceName}ConnectOrCreateInput`
    );

    const nodeFieldConnectOrCreateInputName = relationshipAdapter.connectOrCreateFieldInputTypeName;

    nodeConnectOrCreateInput.addFields({
        [relationshipAdapter.name]: relationshipAdapter.isList
            ? `[${nodeFieldConnectOrCreateInputName}!]`
            : nodeFieldConnectOrCreateInputName,
    });
}

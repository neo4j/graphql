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
import type { InputTypeComposer, InputTypeComposerFieldConfigMapDefinition, SchemaComposer } from "graphql-compose";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import { ensureNonEmptyInput } from "../ensure-non-empty-input";
import { withCreateInputType } from "../generation/create-input";
import { concreteEntityToCreateInputFields, concreteEntityToUpdateInputFields } from "../to-compose";

export function createOnCreateITC({
    schemaComposer,
    relationshipAdapter,
    targetEntityAdapter,
    userDefinedFieldDirectives,
}: {
    schemaComposer: SchemaComposer;
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    targetEntityAdapter: ConcreteEntityAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): InputTypeComposer {
    const onCreateInput = getOnCreateNodeITC({
        schemaComposer,
        entityAdapter: targetEntityAdapter,
        userDefinedFieldDirectives,
    });
    const onCreateName =
        relationshipAdapter.operations.getConnectOrCreateOnCreateFieldInputTypeName(targetEntityAdapter);
    return schemaComposer.getOrCreateITC(onCreateName, (tc) => {
        const onCreateFields: InputTypeComposerFieldConfigMapDefinition = {
            node: onCreateInput.NonNull,
        };
        if (relationshipAdapter.hasCreateInputFields) {
            const edgeFieldType = withCreateInputType({
                entityAdapter: relationshipAdapter,
                userDefinedFieldDirectives,
                composer: schemaComposer,
            });
            onCreateFields["edge"] = relationshipAdapter.hasNonNullCreateInputFields
                ? edgeFieldType.NonNull
                : edgeFieldType;
        }
        tc.addFields(onCreateFields);
    });
}

export function getOnCreateNodeITC({
    schemaComposer,
    entityAdapter,
    userDefinedFieldDirectives,
}: {
    schemaComposer: SchemaComposer;
    entityAdapter: ConcreteEntityAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): InputTypeComposer {
    return schemaComposer.getOrCreateITC(entityAdapter.operations.onCreateInputTypeName, (tc) => {
        const nodeFields = concreteEntityToCreateInputFields(
            entityAdapter.onCreateInputFields,
            userDefinedFieldDirectives
        );
        tc.addFields(nodeFields);
        ensureNonEmptyInput(schemaComposer, tc);
    });
}

export function getOnUpdateNodeITC({
    schemaComposer,
    entityAdapter,
    userDefinedFieldDirectives,
}: {
    schemaComposer: SchemaComposer;
    entityAdapter: ConcreteEntityAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): InputTypeComposer {
    return schemaComposer.getOrCreateITC(entityAdapter.operations.onUpdateInputTypeName, (tc) => {
        const nodeFields = concreteEntityToUpdateInputFields(
            entityAdapter.onCreateInputFields,
            userDefinedFieldDirectives
        );
        tc.addFields(nodeFields);
        ensureNonEmptyInput(schemaComposer, tc);
    });
}

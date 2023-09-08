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
import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import type { Node } from "../../classes";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationField } from "../../types";
import { upperFirst } from "../../utils/upper-first";
import { ensureNonEmptyInput } from "../ensure-non-empty-input";
import { concreteEntityToCreateInputFields, objectFieldsToCreateInputFields } from "../to-compose";

export function createConnectOrCreateField({
    node,
    relationField,
    schemaComposer,
    hasNonGeneratedProperties,
    hasNonNullNonGeneratedProperties,
}: {
    node: Node;
    relationField: RelationField;
    schemaComposer: SchemaComposer;
    hasNonGeneratedProperties: boolean;
    hasNonNullNonGeneratedProperties: boolean;
}): string | undefined {
    if (!node.uniqueFields.length) {
        return undefined;
    }

    const parentPrefix = `${relationField.connectionPrefix}${upperFirst(relationField.fieldName)}`;

    const connectOrCreateName = relationField.union
        ? `${parentPrefix}${node.name}ConnectOrCreateFieldInput`
        : `${parentPrefix}ConnectOrCreateFieldInput`;

    const onCreateITC = createOnCreateITC({
        schemaComposer,
        prefix: connectOrCreateName,
        node,
        hasNonGeneratedProperties,
        hasNonNullNonGeneratedProperties,
        relationField,
    });
    const whereITC = createWhereITC({ schemaComposer, node });

    schemaComposer.getOrCreateITC(connectOrCreateName, (tc) => {
        tc.addFields({
            where: `${whereITC.getTypeName()}!`,
            onCreate: `${onCreateITC.getTypeName()}!`,
        });
    });
    return relationField.typeMeta.array ? `[${connectOrCreateName}!]` : connectOrCreateName;
}

function createOnCreateITC({
    schemaComposer,
    prefix,
    node,
    hasNonGeneratedProperties,
    hasNonNullNonGeneratedProperties,
    relationField,
}: {
    schemaComposer: SchemaComposer;
    prefix: string;
    node: Node;
    hasNonGeneratedProperties: boolean;
    hasNonNullNonGeneratedProperties: boolean;
    relationField: RelationField;
}): InputTypeComposer {
    const onCreateName = `${prefix}OnCreate`;

    const onCreateFields = getOnCreateFields({
        node,
        hasNonGeneratedProperties,
        relationField,
        hasNonNullNonGeneratedProperties,
        schemaComposer,
    });

    return schemaComposer.getOrCreateITC(onCreateName, (tc) => {
        tc.addFields(onCreateFields);
    });
}

function getOnCreateFields({
    node,
    hasNonGeneratedProperties,
    relationField,
    hasNonNullNonGeneratedProperties,
    schemaComposer,
}: {
    node: Node;
    hasNonGeneratedProperties: boolean;
    relationField: RelationField;
    hasNonNullNonGeneratedProperties: boolean;
    schemaComposer: SchemaComposer;
}): { node: string } | { node: string; edge: string } {
    const nodeCreateInput = schemaComposer.getOrCreateITC(`${node.name}OnCreateInput`, (tc) => {
        const nodeFields = objectFieldsToCreateInputFields([
            ...node.primitiveFields,
            ...node.scalarFields,
            ...node.enumFields,
            ...node.pointFields,
            ...node.temporalFields,
        ]);
        tc.addFields(nodeFields);
        ensureNonEmptyInput(schemaComposer, tc);
    });
    const nodeCreateInputFieldName = `${nodeCreateInput.getTypeName()}!`;

    if (hasNonGeneratedProperties) {
        const edgeField = `${relationField.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}`;
        return {
            node: nodeCreateInputFieldName,
            edge: edgeField,
        };
    }
    return {
        node: nodeCreateInputFieldName,
    };
}

function createWhereITC({ schemaComposer, node }: { schemaComposer: SchemaComposer; node: Node }): InputTypeComposer {
    const connectOrCreateWhereName = `${node.name}ConnectOrCreateWhere`;

    return schemaComposer.getOrCreateITC(connectOrCreateWhereName, (tc) => {
        tc.addFields({
            node: `${node.name}UniqueWhere!`,
        });
    });
}

export function createConnectOrCreateField2({
    relationshipAdapter,
    targetEntityAdapter, // TODO: take this from relationshipAdapter.target in the end, currently here bc unions call this function for reach refNode
    schemaComposer,
    userDefinedFieldDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    targetEntityAdapter: ConcreteEntityAdapter;
    schemaComposer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): string | undefined {
    const hasUniqueFields = targetEntityAdapter.uniqueFields.length > 0;
    if (hasUniqueFields !== true) {
        return undefined;
    }

    const connectOrCreateName = relationshipAdapter.getConnectOrCreateFieldInputTypeName(targetEntityAdapter);

    createOnCreateITC2({
        schemaComposer,
        relationshipAdapter,
        targetEntityAdapter,
        userDefinedFieldDirectives,
    });

    schemaComposer.getOrCreateITC(targetEntityAdapter.operations.connectOrCreateWhereInputTypeName, (tc) => {
        tc.addFields(targetEntityAdapter.operations.connectOrCreateWhereInputFieldNames);
    });

    schemaComposer.getOrCreateITC(connectOrCreateName, (tc) => {
        tc.addFields(relationshipAdapter.getConnectOrCreateInputFields(targetEntityAdapter) || {});
    });
    return relationshipAdapter.isList ? `[${connectOrCreateName}!]` : connectOrCreateName;
}

function createOnCreateITC2({
    schemaComposer,
    relationshipAdapter,
    targetEntityAdapter,
    userDefinedFieldDirectives,
}: {
    schemaComposer: SchemaComposer;
    relationshipAdapter: RelationshipAdapter;
    targetEntityAdapter: ConcreteEntityAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): InputTypeComposer {
    const onCreateName = relationshipAdapter.getConnectOrCreateOnCreateFieldInputTypeName(targetEntityAdapter);

    const onCreateFields = getOnCreateFields2({
        relationshipAdapter,
        targetEntityAdapter,
        schemaComposer,
        userDefinedFieldDirectives,
    });

    return schemaComposer.getOrCreateITC(onCreateName, (tc) => {
        tc.addFields(onCreateFields);
    });
}

function getOnCreateFields2({
    relationshipAdapter,
    targetEntityAdapter,
    schemaComposer,
    userDefinedFieldDirectives,
}: {
    relationshipAdapter: RelationshipAdapter;
    targetEntityAdapter: ConcreteEntityAdapter;
    schemaComposer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}): { node: string } | { node: string; edge: string } {
    schemaComposer.getOrCreateITC(targetEntityAdapter.operations.onCreateInputTypeName, (tc) => {
        const nodeFields = concreteEntityToCreateInputFields(
            targetEntityAdapter.onCreateInputFields,
            userDefinedFieldDirectives
        );
        tc.addFields(nodeFields);
        ensureNonEmptyInput(schemaComposer, tc);
    });

    const nodeCreateInputFieldName = `${targetEntityAdapter.operations.onCreateInputTypeName}!`;
    // TODO: add relationshipAdapter.operations and return fields {edge, node} vs {node} from a method from operations
    if (relationshipAdapter.nonGeneratedProperties.length > 0) {
        return {
            node: nodeCreateInputFieldName,
            edge: relationshipAdapter.edgeCreateInputTypeName,
        };
    }
    return {
        node: nodeCreateInputFieldName,
    };
}

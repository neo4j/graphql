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

import { SchemaComposer, InputTypeComposer } from "graphql-compose";
import { Node } from "../../classes";
import { RelationField } from "../../types";
import { upperFirst } from "../../utils/upper-first";
import { ensureNonEmptyInput } from "../ensureNonEmptyInput";
import { objectFieldsToCreateInputFields } from "../to-compose";

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

function createWhereITC({ schemaComposer, node }: { schemaComposer: SchemaComposer; node: Node }): InputTypeComposer {
    const connectOrCreateWhereName = `${node.name}ConnectOrCreateWhere`;

    return schemaComposer.getOrCreateITC(connectOrCreateWhereName, (tc) => {
        tc.addFields({
            node: `${node.name}UniqueWhere!`,
        });
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

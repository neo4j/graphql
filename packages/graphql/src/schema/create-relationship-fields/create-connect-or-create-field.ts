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

import { SchemaComposer, upperFirst, InputTypeComposer } from "graphql-compose";
import { Node } from "../../classes";
import { RelationField } from "../../types";

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
    if (node.uniqueFields.length === 0) {
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
    const onCreateFields = getOnCreateFields({
        node,
        hasNonGeneratedProperties,
        relationField,
        hasNonNullNonGeneratedProperties,
    });

    const onCreateName = `${prefix}OnCreate`;
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
}: {
    node: Node;
    hasNonGeneratedProperties: boolean;
    relationField: RelationField;
    hasNonNullNonGeneratedProperties: boolean;
}): { node: string } | { node: string; edge: string } {
    const nodeField = `${node.name}CreateInput!`;

    if (hasNonGeneratedProperties) {
        const edgeField = `${relationField.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}`;
        return {
            node: nodeField,
            edge: edgeField,
        };
    }
    return {
        node: nodeField,
    };
}

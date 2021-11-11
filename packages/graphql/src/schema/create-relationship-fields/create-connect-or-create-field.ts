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

import { SchemaComposer, upperFirst } from "graphql-compose";
import { Node } from "../../classes";
import { RelationField } from "../../types";

export function createConnectOrCreateField({
    node,
    rel,
    schemaComposer,
    hasNonGeneratedProperties,
    hasNonNullNonGeneratedProperties,
}: {
    node: Node;
    rel: RelationField;
    schemaComposer: SchemaComposer;
    hasNonGeneratedProperties: boolean;
    hasNonNullNonGeneratedProperties: boolean;
}): string | undefined {
    if (node.uniqueFields.length === 0) {
        return undefined;
    }

    let connectOrCreateName = `${rel.connectionPrefix}${upperFirst(rel.fieldName)}ConnectOrCreateFieldInput`;
    if (rel.union) {
        connectOrCreateName = `${rel.connectionPrefix}${upperFirst(rel.fieldName)}${
            node.name
        }ConnectOrCreateFieldInput`;
    }
    const connectOrCreate = rel.typeMeta.array ? `[${connectOrCreateName}!]` : connectOrCreateName;
    const connectOrCreateOnCreateName = `${connectOrCreateName}OnCreate`;
    schemaComposer.getOrCreateITC(connectOrCreateOnCreateName, (tc) => {
        tc.addFields({
            node: `${node.name}CreateInput!`,
            ...(hasNonGeneratedProperties
                ? { edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}` }
                : {}),
        });
    });

    const connectOrCreateWhere = `${node.name}ConnectOrCreateWhere`;
    schemaComposer.getOrCreateITC(connectOrCreateWhere, (tc) => {
        tc.addFields({
            node: `${node.name}UniqueWhere!`,
        });
    });

    schemaComposer.getOrCreateITC(connectOrCreateName, (tc) => {
        tc.addFields({
            where: `${connectOrCreateWhere}!`,
            onCreate: `${connectOrCreateOnCreateName}!`,
        });
    });
    return connectOrCreate;
}

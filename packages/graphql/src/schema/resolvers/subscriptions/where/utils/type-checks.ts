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

import { int } from "neo4j-driver";
import type { PrimitiveField, RelationField } from "../../../../../types";
import type { InterfaceSpecificType, InterfaceType, StandardType } from "../../types";

export function isFloatType(fieldMeta: PrimitiveField | undefined) {
    return fieldMeta?.typeMeta.name === "Float";
}

export function isStringType(fieldMeta: PrimitiveField | undefined) {
    return fieldMeta?.typeMeta.name === "String";
}

function isIDType(fieldMeta: PrimitiveField | undefined) {
    return fieldMeta?.typeMeta.name === "ID";
}

export function isIDAsString(fieldMeta: PrimitiveField | undefined, value: string | number) {
    return isIDType(fieldMeta) && int(value).toString() !== value;
}

export function isInterfaceType(
    node: StandardType | InterfaceType,
    receivedEventRelationship: RelationField
): node is InterfaceType {
    return !!receivedEventRelationship.interface?.implementations;
}

export function isStandardType(
    node: StandardType | InterfaceType,
    receivedEventRelationship: RelationField
): node is StandardType {
    return !receivedEventRelationship.interface?.implementations;
}

export function isInterfaceSpecificFieldType(node: unknown): node is InterfaceSpecificType {
    return !!node;
}

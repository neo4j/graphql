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

import type { Node, Relationship } from "../../classes";
import type { MutableField } from "../../classes/Node";
import type { MutationOperator } from "../queryAST/factory/parsers/parse-mutation-field";
import { parseMutationField } from "../queryAST/factory/parsers/parse-mutation-field";

export function parseMutableField(
    nodeOrRel: Node | Relationship,
    key: string
): { settableField: MutableField; operator: MutationOperator | undefined } {
    const { fieldName, operator } = parseMutationField(key);
    const field = nodeOrRel.mutableFields.find((x) => x.fieldName === fieldName);

    if (field) {
        return { settableField: field, operator: operator };
    }

    throw new Error(`Transpile error: field ${key} not found`);
}

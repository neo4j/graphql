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
import type { FieldDefinitionNode } from "graphql";
import { Kind } from "graphql";
import { getInnerTypeName } from "../utils/utils";
import { DocumentValidationError } from "../utils/document-validation-error";
import type { ObjectOrInterfaceWithExtensions } from "../utils/path-parser";

export function verifyTimestamp({
    traversedDef,
}: {
    traversedDef: ObjectOrInterfaceWithExtensions | FieldDefinitionNode;
}) {
    if (traversedDef.kind !== Kind.FIELD_DEFINITION) {
        // delegate
        return;
    }
    if (traversedDef.type.kind === Kind.LIST_TYPE) {
        throw new DocumentValidationError("Cannot autogenerate an array.", ["@timestamp"]);
    }
    if (!["DateTime", "Time"].includes(getInnerTypeName(traversedDef.type))) {
        throw new DocumentValidationError("Cannot timestamp Temporal fields lacking time zone information.", [
            "@timestamp",
        ]);
    }
}

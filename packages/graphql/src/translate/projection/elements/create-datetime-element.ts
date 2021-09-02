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

import { ResolveTree } from "graphql-parse-resolve-info";
import { DateTimeField } from "../../../types";

function createDatetimeElement({
    resolveTree,
    field,
    variable,
    valueOverride,
}: {
    resolveTree: ResolveTree;
    field: DateTimeField;
    variable: string;
    valueOverride?: string;
}): string {
    const dbFieldName = field.dbPropertyName || resolveTree.name;
    return field.typeMeta.array
        ? `${resolveTree.alias}: [ dt in ${variable}.${dbFieldName} | apoc.date.convertFormat(toString(dt), "iso_zoned_date_time", "iso_offset_date_time") ]`
        : `${resolveTree.alias}: apoc.date.convertFormat(toString(${
              valueOverride || `${variable}.${dbFieldName}`
          }), "iso_zoned_date_time", "iso_offset_date_time")`;
}

export default createDatetimeElement;

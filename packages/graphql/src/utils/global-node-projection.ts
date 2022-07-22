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

import { omit } from "graphql-compose";
import type { ResolveTree } from "graphql-parse-resolve-info";

interface ResolveTreeMap {
    [key: string]: ResolveTree;
}

function createProjection(globalIdField: string): ResolveTree {
    return {
        alias: globalIdField,
        args: {},
        fieldsByTypeName: {},
        name: globalIdField,
    };
}

export function addGlobalIdField(ogProjection: ResolveTreeMap, globalIdField: string): ResolveTreeMap {
    const alreadyProjected = Object.values(ogProjection).find((x) => x.name === globalIdField);
    // if the db field has not been projected, we need to add it to the projection
    const projection = alreadyProjected
        ? { ...ogProjection }
        : { ...ogProjection, [globalIdField]: createProjection(globalIdField) };

    // if the projection has the id field, but the globalIdField is not "id" we delete it
    return globalIdField !== "id" ? omit(projection, "id") : projection;
}

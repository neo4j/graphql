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

import type { ObjectTypeComposerFieldConfigDefinition } from "graphql-compose";
import type { GraphQLResolveInfo } from "graphql";
import { execute } from "../../../utils";
import { translateRead } from "../../../translate";
import type { Node } from "../../../classes";
import type { Context } from "../../../types";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";

export function fulltextResolver(
    { node }: { node: Node },
    resultTypeName: string,
    whereTypeName: string,
    sortTypeName: string
): ObjectTypeComposerFieldConfigDefinition<any, any, any> {
    async function resolve(_root: any, args: any, _context: unknown, info: GraphQLResolveInfo) {
        const context = _context as Context;
        context.resolveTree = getNeo4jResolveTree(info, { args });

        const { cypher, params } = translateRead({ context, node });
        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
        });

        return executeResult.records.map((x) => x.this);
    }

    return {
        type: `[${resultTypeName}!]!`,
        resolve,
        args: { phrase: "String!", where: `${whereTypeName}`, sort: `${sortTypeName}`, limit: "Int", offset: "Int" },
    };
}

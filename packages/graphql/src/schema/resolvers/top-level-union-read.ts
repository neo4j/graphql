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

import type { GraphQLResolveInfo } from "graphql";
import translateToplevelUnionRead from "../../translate/translate-top-level-union-read";
import type { Context } from "../../types";
import { execute } from "../../utils";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";
import type { Union } from "../../classes/Union";

export default function topLevelUnionReadResolver({ union }: { union: Union }) {
    async function resolve(_root: any, args: any, _context: unknown, info: GraphQLResolveInfo) {
        const context = _context as Context;

        context.resolveTree = getNeo4jResolveTree(info, { args });

        const [cypher, params] = translateToplevelUnionRead({ union, context });

        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
        });

        const record = executeResult.records[0];
        const result = record && Object.entries(record).flatMap(([, members]) => members);

        return result || [];
    }

    return {
        type: `[${union.name}!]!`,
        resolve,
        args: {
            where: `${union.whereTypeMeta.name}`,
        },
    };
}

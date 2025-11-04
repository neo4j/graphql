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

import Cypher from "@neo4j/cypher-builder";
import { filterTruthy } from "../../../utils/utils";
import type { QueryASTContext } from "../ast/QueryASTContext";
import type { QueryASTNode } from "../ast/QueryASTNode";

/** Gets subqueries from fields and map these to Call statements with inner target */
export function wrapSubqueriesInCypherCalls(
    context: QueryASTContext,
    fields: QueryASTNode[],
    withArgs?: Cypher.Variable[]
): Cypher.Clause[] {
    return filterTruthy(
        fields.flatMap((f) => {
            return f.getSubqueries(context);
        })
    ).map((sq) => {
        const call = new Cypher.Call(sq);
        if (withArgs) {
            call.importWith(...withArgs);
        }
        return call;
    });
}

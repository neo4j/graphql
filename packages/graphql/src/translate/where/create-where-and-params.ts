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

import type { GraphQLWhereArg, Context } from "../../types";
import type { Node } from "../../classes";
import { createWherePredicate } from "./create-where-predicate";
import Cypher from "@neo4j/cypher-builder";

// TODO: Remove this method and replace for directly using createWherePredicate
/** Wraps createCypherWhereParams with the old interface for compatibility with old way of composing cypher */
export default function createWhereAndParams({
    whereInput,
    varName,
    chainStr,
    node,
    context,
    recursing,
}: {
    node: Node;
    context: Context;
    whereInput: GraphQLWhereArg;
    varName: string;
    chainStr?: string;
    recursing?: boolean;
}): [string, any] {
    const nodeRef = new Cypher.NamedNode(varName);

    const [preComputedWhereFields, wherePredicate] = createWherePredicate({
        element: node,
        context,
        whereInput,
        targetElement: nodeRef,
    });

    const withClause = new Cypher.With("*");
    
    if (wherePredicate) {
        withClause.where(wherePredicate);
    }

    const result = Cypher.concat(...preComputedWhereFields, withClause).build();
    return [result.cypher, result.params];

    // const whereCypher = new Cypher.RawCypher((env: Cypher.Environment) => {
    //     const cypher = wherePredicate?.getCypher(env) || "";

    //     return [cypher, {}];
    // });

    // const result = whereCypher.build(`${chainStr || ""}${varName}_`);
    // const whereStr = `${!recursing ? "WHERE " : ""}`;

    // return [`${whereStr}${result.cypher}`, result.params];
}

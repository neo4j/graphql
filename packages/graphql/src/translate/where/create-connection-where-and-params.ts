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
import type { ConnectionWhereArg, Context } from "../../types";
import Cypher from "@neo4j/cypher-builder";
import { createConnectionWherePropertyOperation } from "./property-operations/create-connection-operation";
import { compileCypher } from "../../utils/compile-cypher";

export default function createConnectionWhereAndParams({
    whereInput,
    context,
    node,
    nodeVariable,
    relationship,
    relationshipVariable,
    parameterPrefix,
}: {
    whereInput: ConnectionWhereArg;
    context: Context;
    node: Node;
    nodeVariable: string;
    relationship: Relationship;
    relationshipVariable: string;
    parameterPrefix: string;
}): { cypher: string; subquery: string; params: Record<string, any> } {
    const nodeRef = new Cypher.NamedNode(nodeVariable);
    const edgeRef = new Cypher.NamedVariable(relationshipVariable);

    const { predicate: andOp, preComputedSubqueries } = createConnectionWherePropertyOperation({
        context,
        whereInput,
        edgeRef,
        targetNode: nodeRef,
        node,
        edge: relationship,
    });

    let subquery = "";
    const whereCypher = new Cypher.RawCypher((env: Cypher.Environment) => {
        const cypher = (andOp as any)?.getCypher(env) || "";
        if (preComputedSubqueries) {
            subquery = compileCypher(preComputedSubqueries, env);
        }
        return [cypher, {}];
    });

    // NOTE: the following prefix is just to avoid collision until this is refactored into a single cypher ast
    const result = whereCypher.build(`${parameterPrefix.replace(/\./g, "_").replace(/\[|\]/g, "")}_${nodeVariable}`);
    return { cypher: result.cypher, subquery, params: result.params };
}

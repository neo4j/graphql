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
import type { Context, Node } from "../../../types";
import type { AuthorizationOperation } from "../../../types/authorization";
import { createAuthorizationBeforePredicate } from "../create-authorization-before-predicate";
import type { NodeMap } from "../types/node-map";
import { compileCypher } from "../../../utils/compile-cypher";

export type AuthorizationBeforeAndParams = {
    cypher: string;
    params: Record<string, any>;
    subqueries?: string;
};

type StringNodeMap = {
    node: Node;
    variable: string;
    fieldName?: string;
};

function stringNodeMapToNodeMap(stringNodeMap: StringNodeMap[]): NodeMap[] {
    return stringNodeMap.map((nodeMap) => {
        return {
            ...nodeMap,
            variable: new Cypher.NamedNode(nodeMap.variable),
        };
    });
}

export function createAuthorizationBeforeAndParams({
    context,
    nodes,
    operations,
}: {
    context: Context;
    nodes: StringNodeMap[];
    operations: AuthorizationOperation[];
}): AuthorizationBeforeAndParams | undefined {
    const nodeMap = stringNodeMapToNodeMap(nodes);

    const predicateReturn = createAuthorizationBeforePredicate({
        context,
        nodes: nodeMap,
        operations,
    });

    if (predicateReturn) {
        const result: AuthorizationBeforeAndParams = { cypher: "", params: {} };

        const { predicate, preComputedSubqueries } = predicateReturn;

        if (predicate) {
            const predicateCypher = new Cypher.RawCypher((env) => {
                return compileCypher(predicate, env);
            });
            const { cypher, params } = predicateCypher.build("authorization_");
            result.cypher = cypher;
            result.params = params;
        }

        if (preComputedSubqueries && !preComputedSubqueries.empty) {
            const { cypher } = preComputedSubqueries.build("authorization_");
            result.subqueries = cypher;
        }

        return result;
    }

    return undefined;
}

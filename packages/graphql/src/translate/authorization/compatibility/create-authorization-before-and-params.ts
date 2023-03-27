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

export type AuthorizationBeforeAndParams = {
    cypher: string;
    params: Record<string, any>;
    subqueries?: string;
};

export function createAuthorizationBeforeAndParams({
    context,
    variable,
    node,
    operations,
    fieldName,
}: {
    context: Context;
    variable: string;
    node: Node;
    operations: AuthorizationOperation[];
    fieldName?: string;
}): AuthorizationBeforeAndParams | undefined {
    const predicateReturn = createAuthorizationBeforePredicate({
        context,
        node,
        operations,
        fieldName,
        variable: new Cypher.NamedNode(variable),
    });

    if (predicateReturn) {
        const result: AuthorizationBeforeAndParams = { cypher: "", params: {} };

        const { predicate, preComputedSubqueries } = predicateReturn;

        if (predicate) {
            const predicateCypher = new Cypher.RawCypher((env) => {
                return predicate.getCypher(env);
            });
            const { cypher, params } = predicateCypher.build();
            result.cypher = cypher;
            result.params = params;
        }

        if (preComputedSubqueries && !preComputedSubqueries.empty) {
            const { cypher } = preComputedSubqueries.build();
            result.subqueries = cypher;
        }

        return result;
    }

    return undefined;
}

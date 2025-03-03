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
import type { PredicateReturn } from "../../../types";
import { compileCypher } from "../../../utils/compile-cypher";

type CompiledPredicateReturn = {
    cypher: string;
    params: Record<string, any>;
    subqueries?: string;
};

/**
 * Compiles Cypher, parameters and subqueries in the same Cypher Builder environment.
 *
 * The subqueries contain variables required by the predicate, and if they are not compiled with the same
 * environment, the predicate will be referring to non-existent variables and will re-assign variable from the subqueries.
 */
export function compilePredicateReturn(
    predicateReturn: PredicateReturn,
    indexPrefix?: string
): CompiledPredicateReturn {
    const result: CompiledPredicateReturn = { cypher: "", params: {} };

    const { predicate, preComputedSubqueries } = predicateReturn;

    let subqueries: string | undefined;

    if (predicate) {
        const predicateCypher = new Cypher.Raw((env) => {
            const predicateStr = compileCypher(predicate, env);
            if (preComputedSubqueries && !preComputedSubqueries.empty) {
                // Assign the Cypher string to a variable outside of the scope of the compilation
                subqueries = compileCypher(preComputedSubqueries, env);
            }
            return predicateStr;
        });
        const { cypher, params } = predicateCypher.build({ prefix: `authorization_${indexPrefix || ""}` });
        result.cypher = cypher;
        result.params = params;
        result.subqueries = subqueries;
    }

    return result;
}

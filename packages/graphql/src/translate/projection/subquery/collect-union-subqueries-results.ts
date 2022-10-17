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

import type { GraphQLOptionsArg } from "../../../types";
import { Cypher } from "../../cypher-builder/CypherBuilder";
import { addSortAndLimitOptionsToClause } from "./add-sort-and-limit-to-clause";

export function collectUnionSubqueriesResults({
    resultVariable,
    optionsInput,
    isArray,
}: {
    resultVariable: Cypher.Variable;
    optionsInput: GraphQLOptionsArg;
    isArray: boolean;
}): Cypher.Clause {
    const withSortClause = createWithSortAndPaginationClauses(resultVariable, optionsInput);

    let returnProjection = Cypher.collect(resultVariable);
    if (!isArray) {
        returnProjection = Cypher.head(returnProjection);
    }

    const returnClause = new Cypher.Return([returnProjection, resultVariable]);

    return Cypher.concat(withSortClause, returnClause);
}

function createWithSortAndPaginationClauses(variable: Cypher.Variable, optionsInput: GraphQLOptionsArg): Cypher.With {
    const withSortClause = new Cypher.With(variable);

    addSortAndLimitOptionsToClause({
        optionsInput,
        target: variable,
        projectionClause: withSortClause,
    });
    return withSortClause;
}

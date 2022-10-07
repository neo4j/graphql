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

import { toNumber } from "../../../utils/utils";
import type { GraphQLOptionsArg, GraphQLSortArg } from "../../../types";
import type * as Cypher from "../../cypher-builder/CypherBuilder";

export function addSortAndLimitOptionsToClause({
    optionsInput,
    target,
    projectionClause,
}: {
    optionsInput: GraphQLOptionsArg;
    target: Cypher.Variable | Cypher.PropertyRef;
    projectionClause: Cypher.Return | Cypher.With;
}): void {
    if (optionsInput.sort) {
        const orderByParams = createOrderByParams({
            optionsInput,
            target, // This works because targetNode uses alias
        });
        if (orderByParams.length > 0) {
            projectionClause.orderBy(...orderByParams);
        }
    }
    if (optionsInput.limit) {
        const limit = toNumber(optionsInput.limit);
        projectionClause.limit(limit);
    }
    if (optionsInput.offset) {
        const offset = toNumber(optionsInput.offset);
        projectionClause.skip(offset);
    }
}

function createOrderByParams({
    optionsInput,
    target,
}: {
    optionsInput: GraphQLOptionsArg;
    target: Cypher.Variable | Cypher.PropertyRef;
}): Array<[Cypher.Expr, Cypher.Order]> {
    const orderList = (optionsInput.sort || []).flatMap((arg: GraphQLSortArg): Array<[string, "ASC" | "DESC"]> => {
        return Object.entries(arg);
    });

    return orderList.map(([field, order]) => {
        return [target.property(field), order];
    });
}

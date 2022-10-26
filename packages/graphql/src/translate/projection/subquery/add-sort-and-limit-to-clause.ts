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

import * as neo4j from "neo4j-driver";
import type { Context, GraphQLOptionsArg, GraphQLSortArg, NestedGraphQLSortArg } from "../../../types";
import * as CypherBuilder from "../../cypher-builder/CypherBuilder";
import type { Node } from "../../../classes";
import { lowerFirst } from "../../../utils/lower-first";

export function addLimitOrOffsetOptionsToClause({
    optionsInput,
    projectionClause,
}: {
    optionsInput: GraphQLOptionsArg;
    projectionClause: CypherBuilder.Return | CypherBuilder.With;
}): void {
    if (optionsInput.limit) {
        projectionClause.limit(new CypherBuilder.Param(neo4j.int(optionsInput.limit)));
    }
    if (optionsInput.offset) {
        projectionClause.skip(new CypherBuilder.Param(neo4j.int(optionsInput.offset)));
    }
}

export function addSortAndLimitOptionsToClause({
    optionsInput,
    target,
    projectionClause,
    varName,
    node,
    context,
}: {
    optionsInput: GraphQLOptionsArg;
    target: CypherBuilder.Variable | CypherBuilder.PropertyRef;
    projectionClause: CypherBuilder.Return | CypherBuilder.With;
    varName?: string;
    node?: Node;
    context?: Context;
}): void {
    if (optionsInput.sort) {
        const orderByParams = createOrderByParams({
            optionsInput,
            target, // This works because targetNode uses alias
            varName,
            node,
            context,
        });
        if (orderByParams.length > 0) {
            projectionClause.orderBy(...orderByParams);
        }
    }
    addLimitOrOffsetOptionsToClause({
        optionsInput,
        projectionClause,
    });
}

function createOrderByParams({
    optionsInput,
    target,
    varName,
    node,
    context,
}: {
    optionsInput: GraphQLOptionsArg;
    target: CypherBuilder.Variable | CypherBuilder.PropertyRef;
    varName?: string;
    node?: Node;
    context?: Context;
}): Array<[CypherBuilder.Expr, CypherBuilder.Order]> {
    let sortOptions = optionsInput.sort || [];
    if (node?.name && optionsInput.sort?.[lowerFirst(node?.name)]) {
        sortOptions = optionsInput.sort?.[lowerFirst(node?.name)];
    }
    const orderList = sortOptions.flatMap(
        (arg: GraphQLSortArg | NestedGraphQLSortArg): Array<[string, "ASC" | "DESC"]> => {
            if (
                context?.fulltextIndex &&
                node?.name &&
                arg[lowerFirst(node.name)] &&
                typeof arg[lowerFirst(node.name)] === "object"
            ) {
                return Object.entries(arg[lowerFirst(node.name)] as GraphQLSortArg);
            }
            return Object.entries(arg);
        }
    );
    return orderList.map(([field, order]) => {
        if (varName && node?.cypherFields.some((f) => f.fieldName === field)) {
            return [new CypherBuilder.NamedVariable(`${varName}_${field}`), order];
        }
        if (context?.fulltextIndex && field === "score") {
            return [context.fulltextIndex.scoreVariable, order];
        }
        return [target.property(field), order];
    });
}

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

import type { ResolveTree } from "graphql-parse-resolve-info";
import { cursorToOffset } from "graphql-relay";
import type { Integer } from "neo4j-driver";
import { isNeoInt, isString, toNumber } from "../../utils/utils";
import { Cypher } from "../cypher-builder/CypherBuilder";
import {
    addSortAndLimitOptionsToClause,
    addLimitOrOffsetOptionsToClause,
} from "../projection/subquery/add-sort-and-limit-to-clause";
import { getSortFields } from "./get-sort-fields";

export function createSortAndLimitProjection({
    resolveTree,
    relationshipRef,
    nodeRef,
    limit,
    extraFields = [],
    ignoreSkipLimit = false,
}: {
    resolveTree: ResolveTree;
    relationshipRef: Cypher.Relationship | Cypher.Variable;
    nodeRef: Cypher.Node | Cypher.Variable | Cypher.PropertyRef;
    limit: Integer | number | undefined;
    extraFields?: Cypher.Variable[];
    ignoreSkipLimit?: boolean;
}): Cypher.With | undefined {
    const nodeAndEdgeSortFields = getSortFields(resolveTree);
    if (nodeAndEdgeSortFields.length === 0 && !limit) {
        return undefined;
    }

    const withStatement = new Cypher.With(relationshipRef, ...extraFields);
    let firstArg = resolveTree.args.first as Integer | number | undefined;
    const afterArg = resolveTree.args.after as string | undefined;
    let offset = isString(afterArg) ? cursorToOffset(afterArg) + 1 : undefined;

    if (limit) {
        const limitValue = isNeoInt(limit) ? limit.toNumber() : limit;
        if (!firstArg || limitValue < toNumber(firstArg)) {
            firstArg = limitValue;
        }
    }
    if (ignoreSkipLimit) {
        offset = undefined;
        firstArg = undefined;
    }
    nodeAndEdgeSortFields.forEach((sortField) => {
        const [nodeOrEdge, sortKeyAndValue] = Object.entries(sortField)[0];
        addSortAndLimitOptionsToClause({
            optionsInput: { sort: [sortKeyAndValue], limit: firstArg, offset },
            target: nodeOrEdge === "node" ? nodeRef : relationshipRef,
            projectionClause: withStatement,
        });
    });
    if (limit) {
        // this limit is specified using `@queryOptions` directive
        addLimitOrOffsetOptionsToClause({
            optionsInput: { limit: firstArg, offset },
            projectionClause: withStatement,
        });
    }

    return withStatement;
}

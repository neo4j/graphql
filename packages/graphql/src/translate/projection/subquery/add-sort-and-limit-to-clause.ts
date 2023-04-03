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
import type {
    CypherField,
    CypherFieldReferenceMap,
    GraphQLOptionsArg,
    GraphQLSortArg,
    NestedGraphQLSortArg,
} from "../../../types";
import Cypher from "@neo4j/cypher-builder";
import { SCORE_FIELD } from "../../../graphql/directives/fulltext";

export function addLimitOrOffsetOptionsToClause({
    optionsInput,
    projectionClause,
}: {
    optionsInput: GraphQLOptionsArg;
    projectionClause: Cypher.Return | Cypher.With;
}): void {
    if (optionsInput.limit) {
        projectionClause.limit(new Cypher.Param(neo4j.int(optionsInput.limit)));
    }
    if (optionsInput.offset) {
        projectionClause.skip(new Cypher.Param(neo4j.int(optionsInput.offset)));
    }
}

export function addSortAndLimitOptionsToClause({
    optionsInput,
    target,
    projectionClause,
    nodeField,
    fulltextScoreVariable,
    cypherFields,
    cypherFieldAliasMap,
}: {
    optionsInput: GraphQLOptionsArg;
    target: Cypher.Variable | Cypher.PropertyRef;
    projectionClause: Cypher.Return | Cypher.With;
    nodeField?: string;
    fulltextScoreVariable?: Cypher.Variable;
    cypherFields?: CypherField[];
    cypherFieldAliasMap?: CypherFieldReferenceMap;
}): void {
    if (optionsInput.sort) {
        const orderByParams = createOrderByParams({
            optionsInput,
            target, // This works because targetNode uses alias
            nodeField,
            fulltextScoreVariable,
            cypherFields,
            cypherFieldAliasMap,
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
    nodeField,
    fulltextScoreVariable,
    cypherFields,
    cypherFieldAliasMap,
}: {
    optionsInput: GraphQLOptionsArg;
    target: Cypher.Variable | Cypher.PropertyRef;
    nodeField?: string;
    fulltextScoreVariable?: Cypher.Variable;
    cypherFields?: CypherField[];
    cypherFieldAliasMap?: CypherFieldReferenceMap;
}): Array<[Cypher.Expr, Cypher.Order]> {
    const orderList = (optionsInput.sort || []).flatMap(
        (arg: GraphQLSortArg | NestedGraphQLSortArg): Array<[string, "ASC" | "DESC"]> => {
            if (fulltextScoreVariable && nodeField && arg[nodeField] && typeof arg[nodeField] === "object") {
                return Object.entries(arg[nodeField] as GraphQLSortArg);
            }
            return Object.entries(arg);
        }
    );
    return orderList.map(([field, order]) => {
        // TODO: remove this once translation of cypher fields moved to cypher builder.
        if (cypherFieldAliasMap && cypherFields && cypherFields.some((f) => f.fieldName === field)) {
            return [cypherFieldAliasMap[field] as Cypher.Variable, order];
        }
        if (fulltextScoreVariable && field === SCORE_FIELD) {
            return [fulltextScoreVariable, order];
        }
        return [target.property(field), order];
    });
}

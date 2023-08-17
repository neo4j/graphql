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
import type { GraphQLWhereArg } from "../../../types";
import { asArray } from "../../../utils/utils";
import { getOrCreateCypherVariable } from "../../utils/get-or-create-cypher-variable";
import type { LogicalOperator } from "../../utils/logical-operators";
import { getLogicalPredicate, isLogicalOperator } from "../../utils/logical-operators";
import { createParameterWhere } from "../../where/create-parameter-where";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";

export function createJwtPayloadWherePredicate({
    where,
    context,
}: {
    where: GraphQLWhereArg;
    context: Neo4jGraphQLTranslationContext;
}): Cypher.Predicate | undefined {
    const fields = Object.entries(where);
    const predicates: Cypher.Predicate[] = [];
    getOrCreateCypherVariable;
    fields.forEach(([key, value]) => {
        if (isLogicalOperator(key)) {
            const predicate = createNestedPredicate({
                key,
                value: asArray(value),
                context,
            });
            if (predicate) {
                predicates.push(predicate);
            }
            return;
        }

        const predicate = createParameterWhere({
            key,
            value,
            context,
        });
        if (predicate) {
            predicates.push(predicate);
            return;
        }
    });

    // Implicit AND
    return Cypher.and(...predicates);
}

function createNestedPredicate({
    key,
    value,
    context,
}: {
    key: LogicalOperator;
    value: Array<GraphQLWhereArg>;
    context: Neo4jGraphQLTranslationContext;
}): Cypher.Predicate | undefined {
    const nested: Cypher.Predicate[] = [];

    value.forEach((v) => {
        const predicate = createJwtPayloadWherePredicate({
            where: v,
            context,
        });
        if (predicate) {
            nested.push(predicate);
        }
    });

    return getLogicalPredicate(key, nested);
}

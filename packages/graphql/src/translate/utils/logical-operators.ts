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
import { LOGICAL_OPERATORS } from "../../constants";

export type LogicalOperator = (typeof LOGICAL_OPERATORS)[number];

export function getLogicalPredicate(
    graphQLOperator: LogicalOperator,
    predicates: Cypher.Predicate[]
): Cypher.Predicate | undefined {
    if (predicates.length === 0) return undefined;
    if (graphQLOperator === "NOT") {
        const notPredicate = predicates[0];

        return notPredicate ? Cypher.not(notPredicate) : undefined;
    } else if (graphQLOperator === "AND") {
        return Cypher.and(...predicates);
    } else if (graphQLOperator === "OR") {
        return Cypher.or(...predicates);
    }
}

export function isLogicalOperator(key: string): key is LogicalOperator {
    return (LOGICAL_OPERATORS as ReadonlyArray<unknown>).includes(key);
}

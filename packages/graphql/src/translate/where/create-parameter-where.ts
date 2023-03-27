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
import type { WhereRegexGroups } from "./utils";
import { whereRegEx } from "./utils";
import { createBaseOperation } from "./property-operations/create-comparison-operation";

/** Translates a property into its predicate filter */
export function createParameterWhere({
    key,
    value,
    parameter,
}: {
    key: string;
    value: any;
    parameter: Cypher.Param;
}): Cypher.Predicate | undefined {
    const match = whereRegEx.exec(key);
    if (!match) {
        throw new Error(`Failed to match key in filter: ${key}`);
    }

    const { fieldName, operator } = match?.groups as WhereRegexGroups;

    if (!fieldName) {
        throw new Error(`Failed to find field name in filter: ${key}`);
    }

    if (!operator) {
        throw new Error(`Failed to find operator in filter: ${key}`);
    }

    const isNot = operator.startsWith("NOT") ?? false;

    const comparisonOp = createBaseOperation({
        target: parameter,
        value: new Cypher.Param(value),
        operator,
    });

    if (isNot) {
        return Cypher.not(comparisonOp);
    }

    return comparisonOp;
}

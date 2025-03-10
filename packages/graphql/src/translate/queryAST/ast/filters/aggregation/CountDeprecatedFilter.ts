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
import type { QueryASTContext } from "../../QueryASTContext";
import type { FilterOperator } from "../Filter";
import { CountFilter } from "./CountFilter";

/**
 * @deprecated This Count filter behave as the count filter but does not distinct.
 * For the aggregation inside Connection use the CountFilter instead.
 **/
export class CountDeprecatedFilter extends CountFilter {
    constructor({
        operator,
        comparisonValue,
        attachedTo = "node",
    }: {
        operator: FilterOperator;
        comparisonValue: unknown;
        attachedTo?: "node" | "relationship";
    }) {
        super({ operator, comparisonValue, attachedTo });
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        if (!queryASTContext.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const target = this.getTarget(queryASTContext);

        return this.createBaseOperation({
            operator: this.operator,
            expr: Cypher.count(target),
            param: new Cypher.Param(this.comparisonValue),
        });
    }
}

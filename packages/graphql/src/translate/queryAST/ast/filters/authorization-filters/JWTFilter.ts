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

import type { Predicate } from "@neo4j/cypher-builder";
import Cypher from "@neo4j/cypher-builder";
import { createComparisonOperation } from "../../../utils/create-comparison-operator";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import type { FilterOperator } from "../Filter";
import { Filter } from "../Filter";

export class JWTFilter extends Filter {
    protected operator: FilterOperator;
    protected JWTClaim: Cypher.Property;
    protected comparisonValue: unknown;

    constructor({
        operator,
        JWTClaim,
        comparisonValue,
    }: {
        operator: FilterOperator;
        JWTClaim: Cypher.Property;
        comparisonValue: unknown;
    }) {
        super();
        this.operator = operator;
        this.JWTClaim = JWTClaim;
        this.comparisonValue = comparisonValue;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }
    public print(): string {
        return `${super.print()} <${this.operator} ${this.comparisonValue}>`;
    }
    public getPredicate(_context: QueryASTContext): Predicate | undefined {
        const predicate = createComparisonOperation({
            operator: this.operator,
            property: this.JWTClaim,
            param: new Cypher.Param(this.comparisonValue),
        });

        return Cypher.and(Cypher.isNotNull(this.JWTClaim), predicate);
    }
}

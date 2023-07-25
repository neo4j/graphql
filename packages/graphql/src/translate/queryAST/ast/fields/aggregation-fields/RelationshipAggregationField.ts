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

import type { QueryASTNode } from "../../QueryASTNode";
import type { AggregationOperation } from "../../operations/AggregationOperation";
import { Field } from "../Field";
import Cypher from "@neo4j/cypher-builder";

// TODO: this is an operation field too
/** This class groups a full aggregation operation, not a particular aggregation field, which is a bit confusing */
export class RelationshipAggregationField extends Field {
    private operation: AggregationOperation;

    private projectionVariable = new Cypher.Variable(); // This should be a projection map

    constructor({ operation, alias }: { operation: AggregationOperation; alias: string }) {
        super(alias);
        this.operation = operation;
    }

    public get children(): QueryASTNode[] {
        return [this.operation];
    }

    public getProjectionField(): Record<string, Cypher.Expr> {
        return { [this.alias]: this.operation.aggregationProjectionMap };
    }

    public getSubquery(node: Cypher.Node): Cypher.Clause[] {
        return this.operation.transpile2({ returnVariable: this.projectionVariable, parentNode: node });
    }
}

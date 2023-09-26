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

import type { QueryASTContext } from "../../QueryASTContext";
import { Field } from "../Field";
import type Cypher from "@neo4j/cypher-builder";

export abstract class AggregationField extends Field {
    public getProjectionField(
        _queryASTContext: QueryASTContext,
        _variable?: Cypher.Variable
    ): Record<string, Cypher.Expr> {
        return {};
    }

    public abstract getAggregationExpr(variable: Cypher.Variable): Cypher.Expr;
    public abstract getAggregationProjection(target: Cypher.Variable, returnVar: Cypher.Variable): Cypher.Clause;
}

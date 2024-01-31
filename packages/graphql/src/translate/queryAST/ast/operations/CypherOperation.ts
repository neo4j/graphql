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
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import type { EntitySelection } from "../selection/EntitySelection";
import { ReadOperation } from "./ReadOperation";
import type { OperationTranspileResult } from "./operations";

export class CypherOperation extends ReadOperation {
    public transpile(context: QueryASTContext<Cypher.Node | undefined>): OperationTranspileResult {
        // eslint-disable-next-line prefer-const
        let { selection: matchClause, nestedContext } = this.selection.apply(context);
        const fieldSubqueries = Cypher.concat(
            ...this.getFieldsSubqueries(nestedContext),
            ...this.getCypherFieldsSubqueries(nestedContext)
        );

        const authSubqueries = this.getAuthFilterSubqueries(nestedContext);
        const authPredicates = this.getAuthFilterPredicate(nestedContext);

        const authClauses = authPredicates.length
            ? [...authSubqueries, new Cypher.With("*").where(Cypher.and(...authPredicates))]
            : [];

        const ret = this.getReturnStatement(context, context.returnVariable);
        return {
            clauses: [matchClause, fieldSubqueries, ...authClauses, ret],
            projectionExpr: context.returnVariable,
        };
    }
}

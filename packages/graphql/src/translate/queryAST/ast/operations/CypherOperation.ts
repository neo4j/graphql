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
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import type { EntitySelection, SelectionClause } from "../selection/EntitySelection";
import { ReadOperation } from "./ReadOperation";
import type { OperationTranspileResult } from "./operations";

export class CypherOperation extends ReadOperation {
    private cypherAttributeField: AttributeAdapter;

    constructor({
        cypherAttributeField,
        target,
        relationship,
        selection,
    }: {
        cypherAttributeField: AttributeAdapter;
        target: ConcreteEntityAdapter;
        relationship?: RelationshipAdapter;
        selection: EntitySelection;
    }) {
        super({ target, relationship, selection });
        this.cypherAttributeField = cypherAttributeField;
    }

    public transpile(context: QueryASTContext<Cypher.Node | undefined>): OperationTranspileResult {
        // eslint-disable-next-line prefer-const
        let { selection: matchClause, nestedContext } = this.selection.apply(context);
        const fieldSubqueries = Cypher.concat(
            ...this.getFieldsSubqueries(nestedContext),
            ...this.getCypherFieldsSubqueries(nestedContext)
        );

        const authFilterSubqueries = this.getAuthFilterSubqueries(nestedContext).map((sq) =>
            new Cypher.Call(sq).importWith(nestedContext.target)
        );

        const authPredicates = this.getAuthFilterPredicate(nestedContext);

        const authClauses = authPredicates.length
            ? [...authFilterSubqueries, new Cypher.With("*").where(Cypher.and(...authPredicates))]
            : [];

        const ret = this.getReturnClause(nestedContext, context.returnVariable);
        const extraMatches: SelectionClause[] = this.getChildren().flatMap((f) => f.getSelection(nestedContext));
        const clause = Cypher.concat(matchClause, ...extraMatches, fieldSubqueries, ...authClauses, ret);
        return {
            clauses: [clause],
            projectionExpr: context.returnVariable,
        };
    }

    private getReturnClause(context: QueryASTContext<Cypher.Node>, returnVariable: Cypher.Variable): Cypher.Clause {
        const projection = this.getProjectionMap(context);

        let returnExpr: Cypher.Expr;
        if (context.shouldCollect) {
            returnExpr = Cypher.collect(context.target);
        } else {
            returnExpr = context.target;
        }
        if (context.shouldCollect && !this.cypherAttributeField.typeHelper.isList()) {
            returnExpr = Cypher.head(returnExpr);
        }
        const withClause = new Cypher.With([projection, context.target]);
        if (this.sortFields.length > 0 || this.pagination) {
            this.addSortToClause(context, context.target, withClause);
        }

        return withClause.return([returnExpr, returnVariable]);
    }
}

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
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import type { EntitySelection } from "../../selection/EntitySelection";
import { Operation, type OperationTranspileResult } from "../operations";
import type { CompositeReadPartial } from "./CompositeReadPartial";

export class CompositeCypherOperation extends Operation {
    private selection: EntitySelection;
    private partials: CompositeReadPartial[];
    public cypherAttributeField: AttributeAdapter;

    constructor({
        selection,
        partials,
        cypherAttributeField,
    }: {
        selection: EntitySelection;
        partials: CompositeReadPartial[];
        cypherAttributeField: AttributeAdapter;
    }) {
        super();
        this.selection = selection;
        this.partials = partials;
        this.cypherAttributeField = cypherAttributeField;
    }

    public getChildren(): QueryASTNode[] {
        return [this.selection, ...this.partials];
    }

    public transpile(context: QueryASTContext<Cypher.Node | undefined>): OperationTranspileResult {
        // eslint-disable-next-line prefer-const
        let { selection: matchClause, nestedContext } = this.selection.apply(context);

        const returnVariable = new Cypher.Variable();
        const partialContext = nestedContext.setReturn(returnVariable);
        const partialClauses = this.partials.map((partial) => {
            const { clauses } = partial.transpile(partialContext);
            return Cypher.concat(new Cypher.With("*"), ...clauses);
        });
        const partialsSubquery = new Cypher.Call(new Cypher.Union(...partialClauses)).return(
            partialContext.returnVariable
        );
        /* const returnVar = nestedContext.shouldCollect ? Cypher.collect(returnVariable) : returnVariable;
        const returnVar2 = this.cypherAttributeField.typeHelper.isList() ? returnVar : Cypher.head(returnVar); */

        const returnExpr = this.getReturnExpression(nestedContext, returnVariable);
        const subquery = new Cypher.Call(partialsSubquery)
            .innerWith(nestedContext.target)
            .return([returnExpr, nestedContext.returnVariable]);
        return {
            clauses: [Cypher.concat(matchClause, subquery)],
            projectionExpr: nestedContext.returnVariable,
        };
    }

    private getReturnExpression(
        context: QueryASTContext<Cypher.Node | undefined>,
        returnVariable: Cypher.Variable
    ): Cypher.Expr {
        return this.wrapWithHeadIfNeeded(context, this.wrapWithCollectIfNeeded(context, returnVariable));
    }

    private wrapWithCollectIfNeeded(context: QueryASTContext<Cypher.Node | undefined>, expr: Cypher.Expr): Cypher.Expr {
        if (context.shouldCollect) {
            return Cypher.collect(expr);
        }
        return expr;
    }

    private wrapWithHeadIfNeeded(context: QueryASTContext<Cypher.Node | undefined>, expr: Cypher.Expr): Cypher.Expr {
        if (context.shouldCollect && !this.cypherAttributeField.typeHelper.isList()) {
            return Cypher.head(expr);
        }
        return expr;
    }
}

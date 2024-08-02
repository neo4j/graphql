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
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { QueryASTContext } from "../../translate/queryAST/ast/QueryASTContext";
import type { QueryASTNode } from "../../translate/queryAST/ast/QueryASTNode";
import type { InputField } from "../../translate/queryAST/ast/input-fields/InputField";
import type { OperationTranspileResult } from "../../translate/queryAST/ast/operations/operations";
import { MutationOperation } from "../../translate/queryAST/ast/operations/operations";
import { getEntityLabels } from "../../translate/queryAST/utils/create-node-from-entity";
import { filterTruthy } from "../../utils/utils";
import type { V6ReadOperation } from "./ConnectionReadOperation";

export class V6CreateOperation extends MutationOperation {
    public readonly target: ConcreteEntityAdapter;
    private readonly inputFields: InputField[];
    private readonly createInputParam: Cypher.Param | Cypher.Property;
    private readonly unwindVariable: Cypher.Variable;
    private readonly projection: V6ReadOperation | undefined;

    constructor({
        target,
        createInputParam,
        inputFields,
        projection,
    }: {
        target: ConcreteEntityAdapter;
        createInputParam: Cypher.Param | Cypher.Property;
        inputFields: InputField[];
        projection?: V6ReadOperation;
    }) {
        super();
        this.target = target;
        this.inputFields = inputFields;
        this.createInputParam = createInputParam;
        this.unwindVariable = new Cypher.Variable();
        this.projection = projection;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([...this.inputFields.values(), this.projection]);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }

        const unwindClause = new Cypher.Unwind([this.createInputParam, this.unwindVariable]);

        const createClause = new Cypher.Create(
            new Cypher.Pattern(context.target, { labels: getEntityLabels(this.target, context.neo4jGraphQLContext) })
        );
        const setSubqueries: Cypher.Clause[] = [];
        for (const field of this.inputFields) {
            if (field.attachedTo === "node") {
                createClause.set(...field.getSetParams(context, this.unwindVariable));
                setSubqueries.push(...field.getSubqueries(context));
            }
        }

        const nestedSubqueries = setSubqueries.flatMap((clause) => [
            new Cypher.With(context.target, this.unwindVariable),
            new Cypher.Call(clause).importWith(context.target, this.unwindVariable),
        ]);

        const unwindCreateClauses = Cypher.concat(createClause, ...nestedSubqueries);

        const subQueryClause: Cypher.Clause = new Cypher.Call(
            Cypher.concat(unwindCreateClauses, new Cypher.Return(context.target))
        ).importWith(this.unwindVariable);

        const projectionContext = context.setReturn(new Cypher.NamedVariable("data"));
        const clauses = Cypher.concat(unwindClause, subQueryClause, ...this.getProjectionClause(projectionContext));
        return { projectionExpr: context.returnVariable, clauses: [clauses] };
    }

    private getProjectionClause(context: QueryASTContext): Cypher.Clause[] {
        if (!this.projection) {
            return [];
        }
        return this.projection.transpile(context).clauses;
    }
}

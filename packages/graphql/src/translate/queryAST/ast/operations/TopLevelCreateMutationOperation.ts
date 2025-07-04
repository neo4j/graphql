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
import { filterTruthy } from "../../../../utils/utils";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { OperationField } from "../fields/OperationField";
import type { CreateOperation } from "./CreateOperation";
import { Operation, type OperationTranspileResult } from "./operations";

// This extends Operation because we don't need the mutationOperation API for top level
export class TopLevelCreateMutationOperation extends Operation {
    private readonly target: ConcreteEntityAdapter;
    // The response fields in the mutation, currently only READ operations are supported in the MutationResponse
    private readonly projectionOperations: OperationField[];

    private readonly mutationOperationFields: CreateOperation[] = [];

    constructor({
        target,
        mutationOperationFields,
        projectionOperations,
    }: {
        target: ConcreteEntityAdapter;
        mutationOperationFields: CreateOperation[];
        projectionOperations: OperationField[];
    }) {
        super();
        this.target = target;
        this.mutationOperationFields = mutationOperationFields;
        this.projectionOperations = projectionOperations;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([...this.mutationOperationFields, ...this.projectionOperations]);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const subqueries = this.mutationOperationFields.map((field) => {
            const { clauses, projectionExpr } = field.transpile(context);

            return Cypher.utils.concat(
                ...clauses,
                ...field.getAuthorizationSubqueries(context),
                new Cypher.Return([projectionExpr, context.returnVariable])
            );
        });

        const unionStatement = new Cypher.Call(new Cypher.Union(...subqueries));
        const projection: Cypher.Clause = this.getProjectionClause(context);
        return {
            projectionExpr: context.returnVariable,
            clauses: [unionStatement, projection],
        };
    }

    private getProjectionClause(context: QueryASTContext<Cypher.Node>): Cypher.Clause {
        // TODO, refactor these cases and explicit castings when multiple projection are handled
        if (this.projectionOperations.length === 0) {
            const emptyProjection = new Cypher.Literal("Query cannot conclude with CALL");
            return new Cypher.Return(emptyProjection);
        }
        if (this.projectionOperations.length > 1) {
            throw new Error("TODO: handle multiple projection fields in TopLevelCreateMutationOperation");
        }
        const projectionOperation = this.projectionOperations[0] as OperationField;
        const subqueries = projectionOperation
            .getSubqueries(context)
            .map((sq) => new Cypher.Call(sq, [context.target]));

        const projectionField = Object.values(projectionOperation.getProjectionField())[0] as Cypher.Expr;

        const returnClause = new Cypher.Return([Cypher.collect(projectionField), "data"]);

        let extraWith: Cypher.With | undefined;
        if (subqueries.length > 0) {
            extraWith = new Cypher.With(context.target);
        }

        return Cypher.utils.concat(extraWith, ...subqueries, returnClause);
    }

    private getAuthorizationSubqueries(context: QueryASTContext) {
        return this.mutationOperationFields.flatMap((operation) => {
            return operation.getAuthorizationSubqueries(context);
        });
    }
}

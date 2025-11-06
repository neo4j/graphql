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
import { filterTruthy } from "../../../../utils/utils";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { OperationField } from "../fields/OperationField";
import type { CreateOperation } from "./CreateOperation";
import { Operation, type OperationTranspileResult } from "./operations";

/** Wrapper over createOperation for top level create, that support multiple create operations
 * This extends Operation because we don't need the mutationOperation API for top level
 */
export class TopLevelCreateMutationOperation extends Operation {
    // The response fields in the mutation, currently only READ operations are supported in the MutationResponse
    private readonly projectionOperations: OperationField[];

    private readonly topLevelCreateOperations: CreateOperation[] = [];

    constructor({
        createOperations,
        projectionOperations,
    }: {
        createOperations: CreateOperation[];
        projectionOperations: OperationField[];
    }) {
        super();
        this.topLevelCreateOperations = createOperations;
        this.projectionOperations = projectionOperations;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([...this.topLevelCreateOperations, ...this.projectionOperations]);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const operationQueries = this.topLevelCreateOperations.map((createOperation) => {
            const { clauses, projectionExpr } = createOperation.transpile(context);

            const authSubqueries = this.getAuthorizationSubqueriesForCreateOperation(createOperation, context);

            return Cypher.utils.concat(
                ...clauses,
                ...authSubqueries,
                new Cypher.Return([projectionExpr, context.returnVariable])
            );
        });

        const unionStatement = new Cypher.Call(new Cypher.Union(...operationQueries));
        const projection: Cypher.Clause = this.getProjectionClause(context);
        return {
            projectionExpr: context.returnVariable,
            clauses: [unionStatement, projection],
        };
    }

    private getAuthorizationSubqueriesForCreateOperation(
        operation: CreateOperation,
        context: QueryASTContext<Cypher.Node>
    ): Cypher.Clause[] {
        const authSubqueries = operation.getAuthorizationSubqueries(context).map((sq) => new Cypher.Call(sq, "*"));
        if (authSubqueries.length > 0) {
            return [new Cypher.With("*"), ...authSubqueries];
        }

        return [];
    }

    private getProjectionClause(context: QueryASTContext<Cypher.Node>): Cypher.Clause {
        const projectionOperation = this.projectionOperations[0]; // TODO: multiple projection operations not supported

        if (!projectionOperation) {
            return new Cypher.Finish();
        }

        const subqueries = projectionOperation
            .getSubqueries(context)
            .map((sq) => new Cypher.Call(sq, [context.target]));

        const projectionField = Object.values(projectionOperation.getProjectionField())[0];

        if (!projectionField) {
            throw new Error("Fatal Error: Invalid projectionField, please contact support");
        }

        const returnClause = new Cypher.Return([Cypher.collect(projectionField), "data"]);

        let extraWith: Cypher.With | undefined;
        if (subqueries.length > 0) {
            extraWith = new Cypher.With(context.target);
        }

        return Cypher.utils.concat(extraWith, ...subqueries, returnClause);
    }
}

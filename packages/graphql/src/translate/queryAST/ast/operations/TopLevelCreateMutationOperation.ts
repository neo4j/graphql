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
import type { MutationOperationField } from "../input-fields/MutationOperationField";
import { MutationOperation, type OperationTranspileResult } from "./operations";

export class TopLevelCreateMutationOperation extends MutationOperation {
    private readonly target: ConcreteEntityAdapter;
    // The response fields in the mutation, currently only READ operations are supported in the MutationResponse
    private readonly projectionOperations: OperationField;

    private readonly mutationOperationFields: MutationOperationField[] = [];

    constructor({
        target,
        mutationOperationFields,
        projectionOperations,
    }: {
        target: ConcreteEntityAdapter;
        mutationOperationFields: MutationOperationField[];
        projectionOperations: OperationField;
    }) {
        super();
        this.target = target;
        this.mutationOperationFields = mutationOperationFields;
        this.projectionOperations = projectionOperations;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([...this.mutationOperationFields, this.projectionOperations]);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const subqueries = this.mutationOperationFields.flatMap((field) => {
            return field.getSubqueries(context);
        });
        const unionStatement = new Cypher.Call(new Cypher.Union(...subqueries));
        const projection: Cypher.Clause = this.getProjectionClause(context);
        return { projectionExpr: context.returnVariable, clauses: [unionStatement, projection] };
    }

    private getProjectionClause(context: QueryASTContext<Cypher.Node>): Cypher.Clause {
        const subqueries = this.projectionOperations
            .getSubqueries(context)
            .map((sq) => new Cypher.Call(sq, [context.target]));
        // TODO: Change with another contract from getProjectionField or changing the output cypher.
        const projectionField = Object.values(this.projectionOperations.getProjectionField())[0];

        let returnClause: Cypher.Clause | undefined;
        if (projectionField) {
            returnClause = new Cypher.Return([Cypher.collect(projectionField), "data"]);
        }

        let extraWith: Cypher.With | undefined;
        if (subqueries.length > 0) {
            extraWith = new Cypher.With(context.target);
        }

        return Cypher.utils.concat(extraWith, ...subqueries, returnClause);
    }
}

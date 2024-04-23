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
import { createNodeFromEntity } from "../../utils/create-node-from-entity";
import { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { UpsertSetField } from "../input-fields/UpsertSetField";
import type { ReadOperation } from "./ReadOperation";
import { Operation, type OperationTranspileResult } from "./operations";

export type UpsertOperationFields = {
    setFields: UpsertSetField[];
    onCreateFields: UpsertSetField[];
    onUpdateFields: UpsertSetField[];
};

export class UpsertOperation extends Operation {
    public readonly target: ConcreteEntityAdapter;
    // The response fields in the mutation, currently only READ operations are supported in the MutationResponse
    public projectionOperations: ReadOperation[] = [];

    private operationFields: UpsertOperationFields[] = [];

    constructor({ target }: { target: ConcreteEntityAdapter }) {
        super();
        this.target = target;
    }

    public getChildren(): QueryASTNode[] {
        const upsertOperations = this.operationFields.flatMap((op) => {
            return [...op.setFields, ...op.onCreateFields, ...op.onUpdateFields];
        });
        return filterTruthy([...this.projectionOperations, ...upsertOperations]);
    }

    public addProjectionOperations(operations: ReadOperation[]) {
        this.projectionOperations.push(...operations);
    }

    public addOperationField(fields: UpsertOperationFields) {
        this.operationFields.push(fields);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) throw new Error("No target node found!");

        const mergeClauses: Cypher.Merge[] = [];
        const mergeVariables: Cypher.Variable[] = [];

        for (const fields of this.operationFields) {
            const node = createNodeFromEntity(this.target, context.neo4jGraphQLContext);
            const merge = this.generateMergeStatement(context, node, fields);
            mergeClauses.push(merge);
            mergeVariables.push(node);
        }

        // TODO: move to a selection
        const extraVar = new Cypher.Variable();
        const withStatement = new Cypher.With([new Cypher.List(mergeVariables), extraVar]).unwind([
            extraVar,
            context.target,
        ]);

        const projectionClauses = this.getProjectionClause(context);

        return {
            projectionExpr: context.returnVariable,
            clauses: [...mergeClauses, withStatement, ...projectionClauses],
        };
    }

    private generateMergeStatement(
        context: QueryASTContext,
        node: Cypher.Node,
        { setFields, onCreateFields, onUpdateFields }: UpsertOperationFields
    ): Cypher.Merge {
        const inputParams = this.fieldsToMap(context, setFields);
        const mergeContext = new QueryASTContext({
            ...context,
            target: node,
        });
        const onCreateParams = this.getSetParams(mergeContext, onCreateFields);
        const onUpdateParams = this.getSetParams(mergeContext, onUpdateFields);

        const pattern = new Cypher.Pattern(node).withProperties(inputParams);
        return new Cypher.Merge(pattern).onCreateSet(...onCreateParams).onMatchSet(...onUpdateParams);
    }

    private getProjectionClause(context: QueryASTContext): Cypher.Clause[] {
        return this.projectionOperations.map((operationField) => {
            return Cypher.concat(...operationField.transpile(context).clauses);
        });
    }

    private getSetParams(context: QueryASTContext<Cypher.Node>, inputField: UpsertSetField[]): Cypher.SetParam[] {
        return inputField.flatMap((f) => f.getSetParams(context));
    }

    private fieldsToMap(context, fields: UpsertSetField[]): Record<string, Cypher.Expr> {
        return fields.reduce((acc, field) => {
            const properties = field.getUpsertProperties(context);

            return { ...acc, ...properties };
        }, {});
    }
}

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
import type { ReadOperation } from "./ReadOperation";
import { Operation, type OperationTranspileResult } from "./operations";

/**
 * This is currently just a dummy tree node,
 * The whole mutation part is still implemented in the old way, the current scope of this node is just to contains the nested fields.
 **/
export class UpdateOperation extends Operation {
    public readonly target: ConcreteEntityAdapter;
    // The response fields in the mutation, currently only READ operations are supported in the MutationResponse
    public projectionOperations: ReadOperation[] = [];

    constructor({ target }: { target: ConcreteEntityAdapter }) {
        super();
        this.target = target;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy(this.projectionOperations);
    }

    public addProjectionOperations(operations: ReadOperation[]) {
        this.projectionOperations.push(...operations);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.target) throw new Error("No parent node found!");
        context.env.topLevelOperationName = "UPDATE";
        const clauses = this.getProjectionClause(context);
        return { projectionExpr: context.returnVariable, clauses };
    }

    private getProjectionClause(context: QueryASTContext): Cypher.Clause[] {
        return this.projectionOperations.map((operationField) => {
            return Cypher.concat(...operationField.transpile(context).clauses);
        });
    }
}

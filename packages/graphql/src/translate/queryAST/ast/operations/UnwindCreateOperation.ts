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

import { filterTruthy } from "../../../../utils/utils";
import Cypher from "@neo4j/cypher-builder";
import type { OperationTranspileOptions, OperationTranspileResult } from "./operations";
import { Operation } from "./operations";
import type { QueryASTNode } from "../QueryASTNode";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { QueryASTContext } from "../QueryASTContext";

/**
 * This is currently just a dummy tree node,
 * The whole mutation part is still implemented in the old way, the scope of this node is just to contains the nested fields.
 **/
export class UnwindCreateOperation extends Operation {
    public readonly target: ConcreteEntityAdapter;
    public projectionFields: Operation[] = [];
    public nodeAlias: string | undefined; // This is just to maintain naming with the old way (this), remove after refactor

    constructor({ target }: { target: ConcreteEntityAdapter }) {
        super();
        this.target = target;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy(this.projectionFields);
    }

    public setProjectionFields(operations: Operation[]) {
        this.projectionFields.push(...operations);
    }

    public transpile({ context }: OperationTranspileOptions): OperationTranspileResult {
        if (!context.target) throw new Error("No parent node found!");
        // TODO: implement the actual unwind create
        const clauses = this.getProjectionClause({ context });
        return { projectionExpr: context.returnVariable, clauses };
    }

    private getProjectionClause({ context }: OperationTranspileOptions): Cypher.Clause[] {
        if (this.projectionFields.length === 0) {
            return [new Cypher.Return(new Cypher.Literal("Query cannot conclude with CALL"))];
        }
        return this.projectionFields.map((projectionOP) => {
            return Cypher.concat(...projectionOP.transpile({ context }).clauses);
        });
    }
}

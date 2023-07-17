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

import type { QueryASTNode } from "../QueryASTNode";
import type { ReadOperation } from "../operations/ReadOperation";
import { Field } from "./Field";
import Cypher from "@neo4j/cypher-builder";

export class ConnectionField extends Field {
    private operation: ReadOperation;

    private projectionVariable = new Cypher.Variable();

    constructor({ operation, alias }: { operation: ReadOperation; alias: string }) {
        super(alias);
        this.operation = operation;
    }

    public get children(): QueryASTNode[] {
        return [this.operation];
    }

    public getProjectionField(): Record<string, Cypher.Expr> {
        return { [this.alias]: this.projectionVariable };
    }

    public getSubquery(node: Cypher.Node): Cypher.Clause {
        return this.operation.transpile({ returnVariable: this.projectionVariable, parentNode: node });
    }
}

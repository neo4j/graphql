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
import { ReadOperation } from "./operations/ReadOperation";
import type { QueryASTNode } from "./QueryASTNode";
import { QueryASTContext, QueryASTEnv } from "./QueryASTContext";
import { createNodeFromEntity } from "../utils/create-node-from-entity";
import type { Neo4jGraphQLContext } from "../../../types/neo4j-graphql-context";
import type { Operation, OperationTranspileResult } from "./operations/operations";

export class QueryAST {
    private operation: Operation;

    constructor(operation: Operation) {
        this.operation = operation;
    }

    public build(neo4jGraphQLContext: Neo4jGraphQLContext): Cypher.Clause {
        if (this.operation instanceof ReadOperation) {
            const queryASTEnv = new QueryASTEnv();
            const node = createNodeFromEntity(this.operation.target, neo4jGraphQLContext, this.operation.nodeAlias);

            const context = new QueryASTContext({
                target: node,
                env: queryASTEnv,
                neo4jGraphQLContext,
                returnVariable: new Cypher.NamedVariable("this"),
            });
            return Cypher.concat(...this.transpile(context).clauses);
        }
        throw new Error("Operation not supported yet");
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        return this.operation.transpile({
            context,
        });
    }

    public print(): string {
        const resultLines = getTreeLines(this.operation);
        return resultLines.join("\n");
    }
}

function getTreeLines(treeNode: QueryASTNode, depth: number = 0): string[] {
    const nodeName = treeNode.print();
    const resultLines: string[] = [];

    if (depth === 0) {
        resultLines.push(`${nodeName}`);
    } else if (depth === 1) {
        resultLines.push(`|${"────".repeat(depth)} ${nodeName}`);
    } else {
        resultLines.push(`|${"    ".repeat(depth - 1)} |──── ${nodeName}`);
    }

    const children = treeNode.getChildren();
    if (children.length > 0) {
        children.forEach((curr) => {
            const childLines = getTreeLines(curr, depth + 1);
            resultLines.push(...childLines);
        });
    }

    return resultLines;
}

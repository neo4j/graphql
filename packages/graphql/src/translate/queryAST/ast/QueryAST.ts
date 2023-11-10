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
import type { Neo4jGraphQLContext } from "../../../types/neo4j-graphql-context";
import { createNodeFromEntity } from "../utils/create-node-from-entity";
import { QueryASTContext, QueryASTEnv } from "./QueryASTContext";
import type { QueryASTNode } from "./QueryASTNode";
import { AggregationOperation } from "./operations/AggregationOperation";
import { ConnectionReadOperation } from "./operations/ConnectionReadOperation";
import { ReadOperation } from "./operations/ReadOperation";
import type { Operation, OperationTranspileResult } from "./operations/operations";

export class QueryAST {
    private operation: Operation;

    constructor(operation: Operation) {
        this.operation = operation;
    }

    public build(neo4jGraphQLContext: Neo4jGraphQLContext): Cypher.Clause {
        const context = this.buildQueryASTContext(neo4jGraphQLContext);

        return Cypher.concat(...this.transpile(context).clauses);
    }
    /**
     * Transpile the QueryAST to a Cypher builder tree, this is used temporary to transpile incomplete trees, helpful to migrate the legacy code
     **/
    public transpile(context: QueryASTContext): OperationTranspileResult {
        return this.operation.transpile({
            context,
        });
    }

    public buildQueryASTContext(neo4jGraphQLContext: Neo4jGraphQLContext): QueryASTContext {
        const queryASTEnv = new QueryASTEnv();
        const returnVariable = new Cypher.NamedVariable("this");
        const node = this.getTargetFromOperation(neo4jGraphQLContext);
        return new QueryASTContext({
            target: node,
            env: queryASTEnv,
            neo4jGraphQLContext,
            returnVariable,
        });
    }

    public getTargetFromOperation(neo4jGraphQLContext: Neo4jGraphQLContext): Cypher.Node | undefined {
        if (this.operation instanceof ReadOperation || this.operation instanceof ConnectionReadOperation) {
            return createNodeFromEntity(this.operation.target, neo4jGraphQLContext, this.operation.nodeAlias);
        }
        if (this.operation instanceof AggregationOperation) {
            return createNodeFromEntity(this.operation.entity as any, neo4jGraphQLContext, this.operation.nodeAlias);
        }
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

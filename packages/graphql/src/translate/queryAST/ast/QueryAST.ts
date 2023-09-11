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
import type { ReadOperation } from "./operations/ReadOperation";
import type { QueryASTNode } from "./QueryASTNode";
import { QueryASTContext, QueryASTEnv } from "./QueryASTContext";
import { createNodeFromEntity } from "../utils/create-node-from-entity";
import { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { Neo4jGraphQLContext } from "../../../types/neo4j-graphql-context";

export class QueryAST {
    private operation: ReadOperation;

    constructor(operation: ReadOperation) {
        this.operation = operation;
    }

    public transpile(neo4jGraphQLContext: Neo4jGraphQLContext): Cypher.Clause {
        // const tree = this.operation.getCypherTree({
        //     returnVariable: new Cypher.NamedNode("this"),
        // });

        // return tree.getCypher(
        //     new CypherTreeContext({
        //         target: new Cypher.NamedVariable("this"),
        //     })
        // );
        const queryASTEnv = new QueryASTEnv(neo4jGraphQLContext);
        const node = createNodeFromEntity(
            this.operation.entity as ConcreteEntityAdapter,
            queryASTEnv.neo4jGraphQLContext,
            this.operation.nodeAlias
        );
        const context = new QueryASTContext({
            target: node,
            env: queryASTEnv,
        });
        const result = this.operation.transpile({ context, returnVariable: new Cypher.NamedVariable("this") });
        return result.clauses[0] as Cypher.Clause;
        // const visitor = new QueryASTVisitor();
        // visitor.visit(this.operation);
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

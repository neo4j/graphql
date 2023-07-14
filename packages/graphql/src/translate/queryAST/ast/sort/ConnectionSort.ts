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

import type Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext, QueryASTResult } from "../QueryASTNode";
import { QueryASTNode } from "../QueryASTNode";
import type { PropertySort, SortField } from "./PropertySort";
import type { QueryASTVisitor } from "../../visitors/QueryASTVIsitor";

export class ConnectionSort extends QueryASTNode {
    private nodeSort: PropertySort[] = [];
    private edgeSort: PropertySort[] = [];

    constructor(nodeSort: PropertySort[], edgeSort: PropertySort[]) {
        super();
        this.nodeSort = nodeSort;
        this.edgeSort = edgeSort;
    }

    public get children(): QueryASTNode[] {
        return [...this.nodeSort, ...this.edgeSort];
    }

    public accept(v: QueryASTVisitor): void {
        v.visitSort(this);
    }

    public transpile(ctx: QueryASTContext): QueryASTResult {
        const nodeSort = this.nodeSort.map((s) => s.transpile(ctx.push(ctx.varMap.targetNode)));
        const nodeSortFields = nodeSort.reduce<SortField[]>((acc, nodeRes) => {
            acc.push(...(nodeRes.sortFields || []));
            return acc;
        }, []);
        const edgeSort = this.edgeSort.map((s) => s.transpile(ctx.push(ctx.varMap.edge!)));
        const edgeSortFields = edgeSort.reduce<SortField[]>((acc, nodeRes) => {
            acc.push(...(nodeRes.sortFields || []));
            return acc;
        }, []);
        return {
            sortFields: [...edgeSortFields, ...nodeSortFields],
        };
    }

    // public getSortFields(variable: Cypher.Variable): SortField[] {
    //     // const nodeProperty = variable.property(this.attribute.name); // getDBName?
    //     // return [[nodeProperty, this.direction]];
    //     return [];
    // }

    public getProjectionField(): string | Record<string, Cypher.Expr> {
        return {};
    }
}

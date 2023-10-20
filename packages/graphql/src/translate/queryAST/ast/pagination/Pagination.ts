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
import { int, type Integer } from "neo4j-driver";
import { QueryASTNode } from "../QueryASTNode";

export type PaginationField = {
    skip: Cypher.Param<number | Integer> | undefined;
    limit: Cypher.Param<number | Integer> | undefined;
};

export class Pagination extends QueryASTNode {
    private skip: Integer | undefined;
    private limit: Integer | undefined;

    constructor({ skip, limit }: { skip?: number | Integer; limit?: number | Integer }) {
        super();
        this.skip = this.toNeo4jInt(skip);
        this.limit = this.toNeo4jInt(limit);
    }

    public getPagination(): PaginationField | undefined {
        return {
            skip: this.skip ? new Cypher.Param(this.skip) : undefined,
            limit: this.limit ? new Cypher.Param(this.limit) : undefined,
        };
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    private toNeo4jInt(n: Integer | number | undefined): Integer | undefined {
        if (typeof n === "number") {
            return int(n);
        }
        return n;
    }

    public print(): string {
        return `${super.print()} <skip: ${this.skip} | limit: ${this.limit}>`;
    }
}

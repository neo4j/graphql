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
import type { Integer } from "neo4j-driver";
import { QueryASTNode } from "../QueryASTNode";
import type { QueryASTVisitor } from "../../visitors/QueryASTVIsitor";

export type PaginationField = {
    skip: Cypher.Param<number | Integer> | undefined;
    limit: Cypher.Param<number | Integer> | undefined;
};

export class Pagination extends QueryASTNode {
    private skip: Integer | number | undefined;
    private limit: Integer | number | undefined;

    constructor({ skip, limit }: { skip?: number | Integer; limit?: number | Integer }) {
        super();
        this.skip = skip;
        this.limit = limit;
    }

    public get children(): QueryASTNode[] {
        return [];
    }

    public accept(v: QueryASTVisitor): void {
        v.visitPagination(this);
    }

    public getPagination(): PaginationField | undefined {
        return {
            skip: this.skip ? new Cypher.Param(this.skip) : undefined,
            limit: this.limit ? new Cypher.Param(this.limit) : undefined,
        };
    }
}

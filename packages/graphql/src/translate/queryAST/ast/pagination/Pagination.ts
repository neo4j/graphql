/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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

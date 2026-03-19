/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "./QueryASTContext";

export abstract class QueryASTNode {
    public abstract getChildren(): QueryASTNode[];

    /** Prints the name of the Node */
    public print(): string {
        return this.constructor.name;
    }

    public getSubqueries(_context: QueryASTContext): Cypher.Clause[] {
        return [];
    }

    public getSelection(_context: QueryASTContext): Array<Cypher.Match | Cypher.With> {
        return [];
    }
}

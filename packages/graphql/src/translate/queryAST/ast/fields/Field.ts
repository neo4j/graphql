/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import { QueryASTNode } from "../QueryASTNode";

export abstract class Field extends QueryASTNode {
    public alias: string;

    constructor(alias: string) {
        super();
        this.alias = alias;
    }

    public abstract getProjectionField(variable: Cypher.Variable): string | Record<string, Cypher.Expr>;

    public print(): string {
        return `${super.print()} <${this.alias}>`;
    }

    public isCypherField(): boolean {
        return false;
    }
}

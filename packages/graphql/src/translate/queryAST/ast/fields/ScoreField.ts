/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import type { QueryASTNode } from "../QueryASTNode";
import { Field } from "./Field";

export class ScoreField extends Field {
    private score: Cypher.Variable;

    constructor({ alias, score }: { alias: string; score: Cypher.Variable }) {
        super(alias);
        this.score = score;
    }

    public getProjectionField(): Record<"score", Cypher.Variable> {
        return {
            score: this.score,
        };
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }
}

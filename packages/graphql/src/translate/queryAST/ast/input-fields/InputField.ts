/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../QueryASTContext";
import { QueryASTNode } from "../QueryASTNode";

export abstract class InputField extends QueryASTNode {
    public name: string;
    public attachedTo: "node" | "relationship";

    constructor(name: string, attachedTo: "node" | "relationship" = "node") {
        super();
        this.name = name;
        this.attachedTo = attachedTo;
    }

    public print(): string {
        return `${super.print()} <${this.name}>`;
    }

    public getAuthorizationSubqueries(_context: QueryASTContext): Cypher.Clause[] {
        return [];
    }

    public getPredicate(_queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        return undefined;
    }

    protected getTarget(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.Node | Cypher.Relationship {
        const target = this.attachedTo === "node" ? queryASTContext.target : queryASTContext.relationship;
        if (!target) {
            throw new Error("No target found");
        }
        return target;
    }

    public abstract getSetParams(_queryASTContext: QueryASTContext, inputVariable?: Cypher.Variable): Cypher.SetParam[];
}

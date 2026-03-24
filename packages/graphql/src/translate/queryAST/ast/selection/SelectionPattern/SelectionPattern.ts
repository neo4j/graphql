/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../../QueryASTContext";
import { QueryASTNode } from "../../QueryASTNode";

export abstract class SelectionPattern extends QueryASTNode {
    public getChildren(): QueryASTNode[] {
        return [];
    }

    /** Apply selection over the given context, returns the updated context and the selection clause
     * This ensures the new context matches the generated Cypher (i.e. the target is the nested relationship)
     */
    public abstract apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        pattern: Cypher.Pattern;
    };
}

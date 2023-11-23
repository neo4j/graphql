import type Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../QueryASTContext";
import { QueryASTNode } from "../QueryASTNode";

export type SelectionClause = Cypher.Match | Cypher.With | Cypher.Yield;

export abstract class EntitySelection extends QueryASTNode {
    public getChildren(): QueryASTNode[] {
        return [];
    }

    /** Apply selection over the given context, returns the updated context and the selection clause  */
    public abstract apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    };
}

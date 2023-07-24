import type Cypher from "@neo4j/cypher-builder";
import type { CypherTreeContext } from "./Context";

export abstract class CypherTreeNode<R extends Cypher.Clause | Cypher.Expr = Cypher.Clause> {
    public children: CypherTreeNode[] = [];
    // public parent: CypherTreeNode | undefined;

    protected addChildren(...children: CypherTreeNode[]): void {
        this.children.push(...children);
    }

    public abstract getCypher(ctx: CypherTreeContext): R;
}

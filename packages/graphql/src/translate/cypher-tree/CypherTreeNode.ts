import type Cypher from "@neo4j/cypher-builder";
import type { CypherTreeContext } from "./Context";

export type OrderByCypher = [Cypher.Expr, Cypher.Order];

export abstract class CypherTreeNode<R extends Cypher.Clause | Cypher.Expr | OrderByCypher = Cypher.Clause> {
    public children: CypherTreeNode[] = [];

    protected addChildren(...children: CypherTreeNode[]): void {
        this.children.push(...children);
    }

    public abstract getCypher(ctx: CypherTreeContext): R;
}

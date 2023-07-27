import type Cypher from "@neo4j/cypher-builder";
import type { CypherTreeContext } from "./Context";
import { CypherTreeNode } from "./CypherTreeNode";

export class CypherTreeLimit extends CypherTreeNode<Cypher.Expr> {
    private limit: Cypher.Expr;

    constructor(expr: Cypher.Expr) {
        super();
        this.limit = expr;
    }

    public getCypher(_ctx: CypherTreeContext): Cypher.Expr {
        return this.limit;
    }
}

import type Cypher from "@neo4j/cypher-builder";
import type { CypherTreeContext } from "./Context";
import { CypherTreeNode } from "./CypherTreeNode";

export class CypherTreeSkip extends CypherTreeNode<Cypher.Expr> {
    private skip: Cypher.Expr;

    constructor(expr: Cypher.Expr) {
        super();
        this.skip = expr;
    }

    public getCypher(_ctx: CypherTreeContext): Cypher.Expr {
        return this.skip;
    }
}

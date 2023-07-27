import type Cypher from "@neo4j/cypher-builder";
import type { CypherTreeContext } from "./Context";
import { CypherTreeNode } from "./CypherTreeNode";

export class CypherTreeLimit extends CypherTreeNode<Cypher.Expr> {
    private limit: Cypher.Param;

    constructor(expr: Cypher.Param) {
        super();
        this.limit = expr;
    }

    public getCypher(_ctx: CypherTreeContext): Cypher.Param {
        return this.limit;
    }
}

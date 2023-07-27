import type Cypher from "@neo4j/cypher-builder";
import type { CypherTreeContext } from "./Context";
import { CypherTreeNode } from "./CypherTreeNode";

export class CypherTreeSkip extends CypherTreeNode<Cypher.Expr> {
    private skip: Cypher.Param;

    constructor(expr: Cypher.Param) {
        super();
        this.skip = expr;
    }

    public getCypher(_ctx: CypherTreeContext): Cypher.Param {
        return this.skip;
    }
}

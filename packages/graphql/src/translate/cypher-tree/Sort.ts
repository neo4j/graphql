import type Cypher from "@neo4j/cypher-builder";
import type { CypherTreeContext } from "./Context";
import type { OrderByCypher } from "./CypherTreeNode";
import { CypherTreeNode } from "./CypherTreeNode";

export class CypherTreeSort extends CypherTreeNode<OrderByCypher> {
    private sortField: OrderByCypher;

    constructor(expr: Cypher.Expr, direction: Cypher.Order) {
        super();
        this.sortField = [expr, direction];
    }

    public getCypher(_ctx: CypherTreeContext): OrderByCypher {
        return this.sortField;
    }
}

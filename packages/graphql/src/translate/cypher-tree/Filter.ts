import type Cypher from "@neo4j/cypher-builder";
import type { CypherTreeContext } from "./Context";
import { CypherTreeNode } from "./CypherTreeNode";

export class CypherTreeFilter extends CypherTreeNode<Cypher.Predicate> {
    private predicate: Cypher.Predicate;

    constructor(predicate: Cypher.Predicate) {
        super();
        this.predicate = predicate;
    }

    public getCypher(_ctx: CypherTreeContext): Cypher.Predicate {
        return this.predicate;
    }
}

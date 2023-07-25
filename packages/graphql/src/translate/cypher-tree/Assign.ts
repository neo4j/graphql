import Cypher from "@neo4j/cypher-builder";
import { CypherTreeNode } from "./CypherTreeNode";


export class CypherTreeAssign extends CypherTreeNode {
    private expression: Cypher.Expr;
    private to: Cypher.Variable;
    private collect: boolean;
    
    constructor(expression: Cypher.Expr, to: Cypher.Variable, collect: boolean) {
        super();
        this.expression = expression;
        this.to = to;
        this.collect = collect;
    }

    public getCypher(): Cypher.Clause {
        if (this.collect) {
            const contentVar = new Cypher.Variable();
            return new Cypher.With([this.expression, contentVar]).with([Cypher.collect(contentVar), this.to]);
        }
        return new Cypher.With([this.expression, this.to]);
    }
}
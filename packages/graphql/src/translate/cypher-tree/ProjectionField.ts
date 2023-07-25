import type Cypher from "@neo4j/cypher-builder";
import type { CypherTreeContext } from "./Context";

export class CypherTreeProjectionField {
    public alias: string; // This is an exception
    private expr: Cypher.Expr | undefined;

    constructor(alias: string, expr?: Cypher.Expr) {
        this.alias = alias;
        this.expr = expr;
    }

    public getProjection(_ctx: CypherTreeContext): string | Record<string, Cypher.Expr> {
        if (this.expr) return { [this.alias]: this.expr };
        else return this.alias;
    }
}

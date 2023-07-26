import Cypher from "@neo4j/cypher-builder";
import { CypherTreeNode } from "./CypherTreeNode";
import type { CypherTreeProjectionField } from "./ProjectionField";
import type { CypherTreeContext } from "./Context";

export class CypherTreeAssign extends CypherTreeNode {
    private expression: Cypher.Expr | undefined; // TODO: type Value

    private fields: CypherTreeProjectionField[] = [];
    private to: Cypher.Variable;
    private collect: boolean;

    private extraVars: Cypher.Variable[] = [];

    constructor(to: Cypher.Variable, expr?: Cypher.Expr, collect: boolean = false) {
        super();
        this.expression = expr;
        this.to = to;
        this.collect = collect;
    }

    public withVars(...extraVars: Cypher.Variable[]): this {
        this.extraVars.push(...extraVars);
        return this;
    }

    public addField(field: CypherTreeProjectionField) {
        if (this.expression) throw new Error("Cannot add fields to a value assignment");
        this.fields.push(field);
    }

    public getCypher(ctx: CypherTreeContext): Cypher.Clause {
        const expression = this.getExpr(ctx);
        if (this.collect) {
            const contentVar = new Cypher.Variable();
            return new Cypher.With(...this.extraVars, [expression, contentVar]).with([
                Cypher.collect(contentVar),
                this.to,
            ]);
        }
        return new Cypher.With(...this.extraVars, [expression, this.to]);
    }

    private getExpr(ctx: CypherTreeContext): Cypher.Expr {
        if (this.expression) return this.expression;
        else {
            const mapExpr = new Cypher.Map();
            this.fields.map((f) => f.getMapRecord(ctx)).forEach((r) => mapExpr.set(r));
            return mapExpr;
        }
    }
}

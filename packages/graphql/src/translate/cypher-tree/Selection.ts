import Cypher from "@neo4j/cypher-builder";

class CypherTreeContext {
    public variables: Cypher.Variable[] = [];
}

export abstract class CypherTreeNode<R extends Cypher.Clause | Cypher.Expr = Cypher.Clause> {
    public children: CypherTreeNode[] = [];

    protected addChildren(...children: CypherTreeNode[]): void {
        this.children.push(...children);
    }

    public abstract getCypher(ctx: CypherTreeContext): R;
}

export class Selection extends CypherTreeNode {
    private pattern: Cypher.Pattern;
    private nestedSelection: Selection[] = [];
    private projection: Projection;

    constructor({ pattern, projection }: { pattern: Cypher.Pattern; projection: Projection }) {
        super();
        this.pattern = pattern;
        this.projection = projection;
    }

    public getCypher(ctx: CypherTreeContext): Cypher.Clause {
        const match = new Cypher.Match(this.pattern);
        ctx.variables.push(...this.pattern.getVariables());
        const subqueries = this.nestedSelection
            .map((s) => {
                return s.getCypher(ctx);
            })
            .map((c) => {
                return new Cypher.Call(c).innerWith(...ctx.variables);
            });

        const ret = this.projection.getCypher(ctx);

        return Cypher.concat(match, ...subqueries, ret);
    }
}

export class Projection extends CypherTreeNode {
    private fields: ProjectionField[] = [];
    private preProjection: ProjectionField[] = [];

    public getCypher(ctx: CypherTreeContext): Cypher.Clause {
        let withStatement: Cypher.With | undefined;
        if (this.preProjection.length > 0) {
            withStatement = new Cypher.With();

            for (const p of this.preProjection) {
                withStatement.addColumns([p.getCypher(ctx), p.alias]);
            }
        }

        const ret = new Cypher.Return();
        for (const f of this.fields) {
            ret.addColumns([f.getCypher(ctx), f.alias]);
        }
        return Cypher.concat(withStatement, ret);
    }
}

export class ProjectionField extends CypherTreeNode<Cypher.Expr> {
    public alias: string; // This is an exception
    private expr: Cypher.Expr;

    constructor(alias: string, expr: Cypher.Expr) {
        super();
        this.alias = alias;
        this.expr = expr;
    }

    public getCypher(_ctx: CypherTreeContext): Cypher.Expr {
        return this.expr;
    }
}

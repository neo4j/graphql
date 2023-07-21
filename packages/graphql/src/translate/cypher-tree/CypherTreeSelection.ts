import Cypher from "@neo4j/cypher-builder";

export class CypherTreeContext {
    public variables: Cypher.Variable[];
    public target: Cypher.Variable;

    constructor({ target, vars }: { target: Cypher.Variable; vars?: Cypher.Variable[] }) {
        this.target = target;
        this.variables = vars || [];
    }

    public push(...vars: Cypher.Variable[]): CypherTreeContext {
        return new CypherTreeContext({
            target: this.target,
            vars: [...this.variables, ...vars],
        });
    }
}

export abstract class CypherTreeNode<R extends Cypher.Clause | Cypher.Expr = Cypher.Clause> {
    public children: CypherTreeNode[] = [];
    // public parent: CypherTreeNode | undefined;

    protected addChildren(...children: CypherTreeNode[]): void {
        this.children.push(...children);
    }

    public abstract getCypher(ctx: CypherTreeContext): R;
}

export class CypherTreeSelection extends CypherTreeNode {
    private pattern: Cypher.Pattern;
    private nestedSelection: CypherTreeSelection[] = [];
    private filters: CypherTreeFilter[] = [];
    public projection: CypherTreeProjection;

    constructor({ pattern, target, alias }: { pattern: Cypher.Pattern; target: Cypher.Variable; alias: string }) {
        super();
        this.pattern = pattern;
        this.projection = new CypherTreeProjection(target, alias);
    }

    public addFilter(treeFilter: CypherTreeFilter): void {
        this.filters.push(treeFilter);
    }

    // public hasParentOf(type) {
    //     if (this instanceof FulltextTreeSelection) return true;
    // }

    public addNestedSelection(selection: CypherTreeSelection) {
        this.nestedSelection.push(selection);
    }

    public getCypher(ctx: CypherTreeContext): Cypher.Clause {
        const match = new Cypher.Match(this.pattern);

        const filtersCypher = this.filters.map((f) => f.getCypher(ctx));
        match.where(Cypher.and(...filtersCypher));
        const nestedCtx = ctx.push(...this.pattern.getVariables());
        const subqueries = this.nestedSelection
            .map((s) => {
                return s.getCypher(nestedCtx);
            })
            .map((c) => {
                return new Cypher.Call(c).innerWith(...nestedCtx.variables);
            });

        const ret = this.projection.getCypher(ctx);

        return Cypher.concat(match, ...subqueries, ret);
    }
}

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

export class CypherTreeProjection extends CypherTreeNode {
    private fields: CypherTreeProjectionField[] = [];
    private preProjection: CypherTreeProjectionField[] = [];
    private target: Cypher.Variable;
    private alias: string;

    constructor(target: Cypher.Variable, alias: string) {
        super();
        this.target = target;
        this.alias = alias;
    }

    public addField(field: CypherTreeProjectionField) {
        this.fields.push(field);
    }

    public getCypher(ctx: CypherTreeContext): Cypher.Clause {
        // let withStatement: Cypher.With | undefined;
        // if (this.preProjection.length > 0) {
        //     withStatement = new Cypher.With();

        //     for (const p of this.preProjection) {
        //         withStatement.addColumns([p.getCypher(ctx), p.alias]);
        //     }
        // }

        const mapProjection = new Cypher.MapProjection(this.target);

        for (const f of this.fields) {
            mapProjection.set(f.getProjection(ctx));
            // ret.addColumns([f.getProjection(ctx), f.alias]);
        }
        const ret = new Cypher.Return([mapProjection, this.alias]);
        return Cypher.concat(ret);
    }
}

// export class CypherTreeProjectionField extends CypherTreeNode<Cypher.Expr> {
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

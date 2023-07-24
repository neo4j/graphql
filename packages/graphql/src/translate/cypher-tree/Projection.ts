import Cypher from "@neo4j/cypher-builder";
import { CypherTreeNode } from "./CypherTreeNode";
import type { CypherTreeContext } from "./Context";

export class CypherTreeProjection extends CypherTreeNode {
    private fields: CypherTreeProjectionField[] = [];
    private target: Cypher.Variable;
    private alias: Cypher.Variable;

    public options = {
        aggregation: false,
    };

    constructor(target: Cypher.Variable, alias: Cypher.Variable) {
        super();
        this.target = target;
        this.alias = alias;
    }

    public addField(field: CypherTreeProjectionField) {
        this.fields.push(field);
    }

    public getCypher(ctx: CypherTreeContext): Cypher.Clause {
        const mapProjection = new Cypher.MapProjection(this.target);

        for (const f of this.fields) {
            mapProjection.set(f.getProjection(ctx));
            // ret.addColumns([f.getProjection(ctx), f.alias]);
        }

        // Nested relationships are Cypher Aggregations (collect)
        if (this.options.aggregation) {
            // this.target shouldn't be here (just for compatibility), it should be a new Cypher.Variable
            return new Cypher.With([mapProjection, this.target]).return([Cypher.collect(this.target), this.alias]);
        } else {
            return new Cypher.Return([mapProjection, this.alias]);
        }

        // let withStatement: Cypher.With | undefined;
        // if (this.preProjection.length > 0) {
        //     withStatement = new Cypher.With();

        //     for (const p of this.preProjection) {
        //         withStatement.addColumns([p.getCypher(ctx), p.alias]);
        //     }
        // }
    }
}

export type CypherTreeProjectionFieldOptions = {
    collect: boolean;
};

export class CypherTreeProjectionField {
    public alias: string; // This is an exception
    private expr: Cypher.Expr | undefined;

    private options: CypherTreeProjectionFieldOptions;

    private static DEFAULT_OPTIONS: CypherTreeProjectionFieldOptions = {
        collect: false,
    };

    constructor(alias: string, expr?: Cypher.Expr, opts: Partial<CypherTreeProjectionFieldOptions> = {}) {
        this.alias = alias;
        this.expr = expr;
        this.options = { ...CypherTreeProjectionField.DEFAULT_OPTIONS, ...opts };
    }

    public getProjection(_ctx: CypherTreeContext): string | Record<string, Cypher.Expr> {
        if (this.expr) return { [this.alias]: this.expr };
        else return this.alias;
    }
}

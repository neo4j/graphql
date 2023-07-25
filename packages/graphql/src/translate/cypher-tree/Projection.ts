import Cypher from "@neo4j/cypher-builder";
import { CypherTreeNode } from "./CypherTreeNode";
import type { CypherTreeContext } from "./Context";
import type { CypherTreeProjectionField } from "./ProjectionField";

export class CypherTreeProjection extends CypherTreeNode {
    private fields: CypherTreeProjectionField[] = [];
    private target: Cypher.Variable;
    private alias: Cypher.Variable;

    public options = {
        collect: false,
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

        // Nested relationships are Cypher collects (collect)
        if (this.options.collect) {
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

import Cypher from "@neo4j/cypher-builder";
import { CypherTreeNode } from "./CypherTreeNode";
import type { CypherTreeContext } from "./Context";
import type { CypherTreeProjectionField } from "./ProjectionField";

export class CypherTreeProjection extends CypherTreeNode {
    private fields: Record<string, CypherTreeProjectionField> = {}; // Using an object to avoid duplicate fields
    private target: Cypher.Variable; // If no target, this is a normal map
    private alias: Cypher.Variable;
    private type: "Map" | "MapProjection";

    public options = {
        collect: false,
    };

    constructor(target: Cypher.Variable, alias: Cypher.Variable, type: "Map" | "MapProjection" = "MapProjection") {
        super();
        this.target = target;
        this.alias = alias;
        this.type = type;
    }

    public setType(type: "Map" | "MapProjection"): void {
        this.type = type;
    }

    public addField(field: CypherTreeProjectionField) {
        this.fields[field.alias] = field;
    }

    public getCypher(ctx: CypherTreeContext): Cypher.Clause {
        let mapProjection: Cypher.Map | Cypher.MapProjection;

        const fields = Object.values(this.fields);

        if (this.type === "MapProjection") {
            mapProjection = new Cypher.MapProjection(this.target);

            for (const f of fields) {
                mapProjection.set(f.getMapProjection(ctx));
            }
        } else {
            mapProjection = new Cypher.Map();

            for (const f of fields) {
                mapProjection.set(f.getMapRecord(ctx));
            }
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

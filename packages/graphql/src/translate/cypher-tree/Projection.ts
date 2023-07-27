import Cypher from "@neo4j/cypher-builder";
import { CypherTreeNode } from "./CypherTreeNode";
import type { CypherTreeContext } from "./Context";
import type { CypherTreeProjectionField } from "./ProjectionField";
import type { CypherTreeLimit } from "./Limit";
import type { CypherTreeSkip } from "./Skip";
import type { CypherTreeSort } from "./Sort";

export class CypherTreeProjection extends CypherTreeNode {
    private fields: Record<string, CypherTreeProjectionField> = {}; // Using an object to avoid duplicate fields
    private target: Cypher.Variable; // If no target, this is a normal map
    private alias: Cypher.Variable;
    private type: "Map" | "MapProjection";

    public skip: CypherTreeSkip | undefined;
    public limit: CypherTreeLimit | undefined;
    public sortFields: CypherTreeSort[] = [];

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
            const withClause = new Cypher.With([mapProjection, this.target]);
            const withSortClause = this.getSort(ctx, withClause);
            // this.target shouldn't be here (just for compatibility), it should be a new Cypher.Variable
            return Cypher.concat(withSortClause, new Cypher.Return([Cypher.collect(this.target), this.alias]));
        } else {
            const sortClause = this.getSort(ctx);
            return Cypher.concat(sortClause, new Cypher.Return([mapProjection, this.alias]));
        }
    }

    private getSort(ctx: CypherTreeContext, sortWith?: Cypher.With): Cypher.With | undefined {
        const sortCypherFields = this.sortFields.map((s) => s.getCypher(ctx));
        if (sortCypherFields.length > 0) {
            if (!sortWith) sortWith = new Cypher.With("*");
            sortWith.orderBy(...sortCypherFields); // Maybe this should be part of sort.ts
        }

        if (this.skip) {
            const skipExpr = this.skip.getCypher(ctx);
            if (!sortWith) sortWith = new Cypher.With("*");
            sortWith.skip(skipExpr as any);
        }
        if (this.limit) {
            const limitExpr = this.limit.getCypher(ctx);
            if (!sortWith) sortWith = new Cypher.With("*");
            sortWith.limit(limitExpr as any);
        }

        return sortWith;
    }
}

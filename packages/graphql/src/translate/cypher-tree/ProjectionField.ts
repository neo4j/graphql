import Cypher from "@neo4j/cypher-builder";
import type { CypherTreeContext } from "./Context";

export class CypherTreeProjectionField {
    public alias: string; // This is an exception
    private expr: Cypher.Expr;

    private propertyName: string | undefined;

    constructor(alias: string, expr: Cypher.Expr, propName?: string) {
        this.alias = alias;
        this.expr = expr;
        this.propertyName = propName;
    }

    public getMapProjection(ctx: CypherTreeContext): string | Record<string, Cypher.Expr> {
        // This is just to comply with tck
        if (this.alias === this.propertyName && this.expr instanceof Cypher.Property) {
            return this.alias;
        } else return this.getMapRecord(ctx);
    }

    public getMapRecord(_ctx: CypherTreeContext): Record<string, Cypher.Expr> {
        return { [this.alias]: this.expr };
    }
}

/** Represents a Cypher.Map as int. representation fields */
export class CypherTreeProjectionMapField extends CypherTreeProjectionField {
    private fields: CypherTreeProjectionField[] = [];

    constructor(alias: string) {
        super(alias, Cypher.Null); // TODO: create a new abstract attribute class
    }

    public addField(field: CypherTreeProjectionField) {
        this.fields.push(field);
    }

    // MapField always return a field
    public getMapProjection(ctx: CypherTreeContext): Record<string, Cypher.Expr> {
        return this.getMapRecord(ctx);
    }

    public getMapRecord(ctx: CypherTreeContext): Record<string, Cypher.Expr> {
        const nestedMap = new Cypher.Map();
        this.fields.map((f) => f.getMapRecord(ctx)).forEach((record) => nestedMap.set(record));

        return { [this.alias]: nestedMap };
    }
}

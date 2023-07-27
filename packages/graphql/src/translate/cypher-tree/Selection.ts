import Cypher from "@neo4j/cypher-builder";
import { CypherTreeNode } from "./CypherTreeNode";
import { CypherTreeProjection } from "./Projection";
import type { CypherTreeContext } from "./Context";
import type { CypherTreeFilter } from "./Filter";
import type { CypherTreeAssign } from "./Assign";
import type { CypherTreeSort } from "./Sort";
import type { CypherTreeSkip } from "./Skip";
import type { CypherTreeLimit } from "./Limit";

export class CypherTreeSelection extends CypherTreeNode {
    private pattern: Cypher.Pattern;
    private nestedSelection: CypherTreeSelection[] = [];
    private filters: CypherTreeFilter[] = [];
    private assignments: CypherTreeAssign[] = [];
    public projection: CypherTreeProjection; // This should be an array of projections

    constructor({
        pattern,
        target,
        alias,
    }: {
        pattern: Cypher.Pattern;
        target: Cypher.Variable;
        alias: Cypher.Variable;
    }) {
        super();
        this.pattern = pattern;
        this.projection = new CypherTreeProjection(target, alias);
    }

    public addFilter(treeFilter: CypherTreeFilter): void {
        this.filters.push(treeFilter);
    }

    public addSort(treeSort: CypherTreeSort): void {
        this.projection.sortFields.push(treeSort);
    }

    public setSkip(skip: CypherTreeSkip) {
        this.projection.skip = skip;
    }

    public setLimit(limit: CypherTreeLimit) {
        this.projection.limit = limit;
    }

    public addAssignment(treeAssign: CypherTreeAssign): void {
        this.assignments.push(treeAssign);
    }

    public addNestedSelection(selection: CypherTreeSelection) {
        this.nestedSelection.push(selection);
    }

    public getCypher(ctx: CypherTreeContext): Cypher.Clause {
        const match = new Cypher.Match(this.pattern);

        const filtersCypher = this.filters.map((f) => f.getCypher(ctx));
        match.where(Cypher.and(...filtersCypher));
        const nestedCtx = ctx.push(...this.pattern.getVariables());

        const assignmentCypher = this.assignments.map((ass) => ass.getCypher(ctx));
        // const sortCypherFields = this.sortFields.map((s) => s.getCypher(ctx));
        // let sortWith: Cypher.With | undefined;
        // if (sortCypherFields.length > 0) {
        //     sortWith = new Cypher.With("*").orderBy(...sortCypherFields); // Maybe this should be part of sort.ts
        // }

        // if (this.skip) {
        //     const skipExpr = this.skip.getCypher(ctx);
        //     if (!sortWith) sortWith = new Cypher.With("*");
        //     sortWith.skip(skipExpr as any);
        // }
        // if (this.limit) {
        //     const limitExpr = this.limit.getCypher(ctx);
        //     if (!sortWith) sortWith = new Cypher.With("*");
        //     sortWith.limit(limitExpr as any);
        // }

        const subqueries = this.nestedSelection
            .map((s) => {
                return s.getCypher(nestedCtx);
            })
            .map((c) => {
                return new Cypher.Call(c).innerWith(...nestedCtx.variables);
            });

        const ret = this.projection.getCypher(ctx);

        return Cypher.concat(match, ...subqueries, ...assignmentCypher, ret);
    }
}

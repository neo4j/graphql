/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Clause, Expr, Variable } from "@neo4j/cypher-builder";
import Cypher from "@neo4j/cypher-builder";
import { wrapSubqueriesInCypherCalls } from "../../../utils/wrap-subquery-in-calls";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import { Field } from "../Field";

export class GroupByField extends Field {
    private by: string[];

    private nodeFields: Field[] = [];
    private edgeFields: Field[] = []; // TODO: merge with attachedTo?

    private resultVariable = new Cypher.Variable();

    constructor({ alias, by }: { alias: string; by: string[] }) {
        super(alias);
        this.by = by;
    }

    public print(): string {
        return `${super.print()} [${this.by.join(",")}]`;
    }

    public getProjectionField(_variable: Variable): string | Record<string, Expr> {
        return {
            [this.alias]: this.resultVariable,
        };
    }

    public setNodeFields(fields: Field[]) {
        this.nodeFields = fields;
    }

    public setEdgeFields(fields: Field[]) {
        this.edgeFields = fields;
    }

    public getChildren(): QueryASTNode[] {
        return [...this.nodeFields, ...this.edgeFields];
    }

    public getSubqueries(context: QueryASTContext): Clause[] {
        if (!context.target) {
            throw new Error("Invalid target");
        }

        const subqueries = wrapSubqueriesInCypherCalls(
            context,
            [...this.nodeFields, ...this.edgeFields],
            [context.target]
        );
        const edgeProjectionMap = this.createProjectionMapForEdge(context as QueryASTContext<Cypher.Node>);

        const groupByFields: Array<[Cypher.Expr, string]> = this.by.map((prop) => {
            if (!context.target) {
                throw new Error("target not available");
            }
            return [context.target.property(prop), prop];
        });
        const sq = Cypher.utils.concat(
            ...subqueries,
            new Cypher.Return(...groupByFields, [
                new Cypher.Map({ edges: Cypher.collect(edgeProjectionMap) }),
                this.resultVariable,
            ])
        );

        const edgeVar = new Cypher.NamedVariable("edge");
        const edgesVar = new Cypher.NamedVariable("edges");
        const unwindClause = this.getUnwindClause(context as QueryASTContext<Cypher.Node>, edgeVar, edgesVar);

        return [
            new Cypher.With("*", [
                new Cypher.Collect(
                    new Cypher.Call(Cypher.utils.concat(unwindClause, sq), [edgesVar]).return(this.resultVariable)
                ),
                this.resultVariable,
            ]),
        ];
    }

    private createProjectionMapForEdge(context: QueryASTContext<Cypher.Node>): Cypher.Map {
        const edgeProjectionMap = new Cypher.Map();
        // this.addProjectionMapForRelationshipProperties(context, edgeProjectionMap);

        edgeProjectionMap.set("node", this.createProjectionMapForNode(context));
        // edgeProjectionMap.set("properties", this.createProjectionMapForNode(context));
        return edgeProjectionMap;
    }

    private createProjectionMapForNode(context: QueryASTContext<Cypher.Node>): Cypher.Map {
        const projectionMap = this.generateProjectionMapForFields(this.nodeFields, context.target);
        if (projectionMap.size === 0) {
            projectionMap.set({
                __id: Cypher.elementId(context.target),
            });
        }
        return projectionMap;
    }

    /** Given a set of fields, generate a projection map.
     * @param projectionMap - If provided, the new projection fields will be added to that map, instead of creating a new one
     */
    private generateProjectionMapForFields(
        fields: Field[],
        target: Cypher.Variable,
        projectionMap?: Cypher.Map
    ): Cypher.Map {
        if (!projectionMap) {
            projectionMap = new Cypher.Map();
        }

        fields
            .map((f) => f.getProjectionField(target))
            .forEach((p) => {
                if (typeof p === "string") {
                    projectionMap.set(p, target.property(p));
                } else {
                    projectionMap.set(p);
                }
            });

        return projectionMap;
    }

    private getUnwindClause(
        context: QueryASTContext<Cypher.Node>,
        edgeVar: Cypher.Variable,
        edgesVar: Cypher.Variable
    ): Cypher.With {
        const unwindClause = new Cypher.Unwind([edgesVar, edgeVar]).with([edgeVar.property("node"), context.target]);
        if (context.relationship) {
            unwindClause.addColumns([edgeVar.property("relationship"), context.relationship]);
        }

        return unwindClause;
    }
}

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { CustomCypherSelection } from "../selection/CustomCypherSelection";
import type { FilterOperator, RelationshipWhereOperator } from "./Filter";
import { Filter } from "./Filter";

export class CypherRelationshipFilter extends Filter {
    private returnVariable: Cypher.Node;
    private attribute: AttributeAdapter;
    private selection: CustomCypherSelection;
    private operator: FilterOperator;
    private targetNodeFilters: Filter[] = [];

    constructor({
        selection,
        attribute,
        operator,
        returnVariable,
    }: {
        selection: CustomCypherSelection;
        attribute: AttributeAdapter;
        operator: RelationshipWhereOperator;
        returnVariable: Cypher.Node;
    }) {
        super();
        this.selection = selection;
        this.attribute = attribute;
        this.operator = operator;
        this.returnVariable = returnVariable;
    }

    public getChildren(): QueryASTNode[] {
        return [...this.targetNodeFilters, this.selection];
    }

    public addTargetNodeFilter(...filter: Filter[]): void {
        this.targetNodeFilters.push(...filter);
    }

    public print(): string {
        return `${super.print()} [${this.attribute.name}] <${this.operator}>`;
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const { selection, nestedContext } = this.selection.apply(context);

        const cypherSubquery = selection.return([Cypher.collect(nestedContext.returnVariable), this.returnVariable]);

        return [cypherSubquery];
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const context = queryASTContext.setTarget(this.returnVariable);

        return this.createRelationshipOperation(context);
    }

    private createRelationshipOperation(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const x = new Cypher.Node();
        const context = queryASTContext.setTarget(x);
        const targetNodePredicates = this.targetNodeFilters.map((c) => c.getPredicate(context));
        const innerPredicate = Cypher.and(...targetNodePredicates);

        if (!innerPredicate) {
            return;
        }

        switch (this.operator) {
            case "ALL": {
                return Cypher.all(x, this.returnVariable, innerPredicate);
            }
            case "SINGLE": {
                return Cypher.single(x, this.returnVariable, innerPredicate);
            }
            case "NONE": {
                return Cypher.none(x, this.returnVariable, innerPredicate);
            }
            case "SOME": {
                return Cypher.any(x, this.returnVariable, innerPredicate);
            }
        }
    }
}

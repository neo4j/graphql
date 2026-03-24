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

export class CypherOneToOneRelationshipFilter extends Filter {
    private returnVariable: Cypher.Node;
    private attribute: AttributeAdapter;
    private selection: CustomCypherSelection;
    private operator: FilterOperator;
    private targetNodeFilters: Filter[] = [];
    private isNull: boolean;

    constructor({
        selection,
        attribute,
        operator,
        isNull,
        returnVariable,
    }: {
        selection: CustomCypherSelection;
        attribute: AttributeAdapter;
        operator: RelationshipWhereOperator;
        isNull: boolean;
        returnVariable: Cypher.Node;
    }) {
        super();
        this.selection = selection;
        this.attribute = attribute;
        this.isNull = isNull;
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

        const cypherSubquery = selection.return([
            Cypher.head(Cypher.collect(nestedContext.returnVariable)),
            this.returnVariable,
        ]);

        return [cypherSubquery];
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const context = queryASTContext.setTarget(this.returnVariable);

        return this.createRelationshipOperation(context);
    }

    private createRelationshipOperation(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const targetNodePredicates = this.targetNodeFilters.map((c) => c.getPredicate(queryASTContext));
        const innerPredicate = Cypher.and(...targetNodePredicates);

        if (this.isNull) {
            return Cypher.and(innerPredicate, Cypher.isNull(this.returnVariable));
        }

        return innerPredicate;
    }
}

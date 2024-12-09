/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
    private isNot: boolean;

    constructor({
        selection,
        attribute,
        operator,
        isNot,
        returnVariable,
    }: {
        selection: CustomCypherSelection;
        attribute: AttributeAdapter;
        operator: RelationshipWhereOperator;
        isNot: boolean;
        returnVariable: Cypher.Node;
    }) {
        super();
        this.selection = selection;
        this.attribute = attribute;
        this.isNot = isNot;
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
        return `${super.print()} [${this.attribute.name}] <${this.isNot ? "NOT " : ""}${this.operator}>`;
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const { selection, nestedContext } = this.selection.apply(context);

        const cypherSubquery = selection.return([Cypher.collect(nestedContext.returnVariable), this.returnVariable]);

        return [cypherSubquery];
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const context = queryASTContext.setTarget(this.returnVariable);

        const predicate = this.createRelationshipOperation(context);
        if (predicate) {
            return this.wrapInNotIfNeeded(predicate);
        }
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

    private wrapInNotIfNeeded(predicate: Cypher.Predicate): Cypher.Predicate {
        // TODO: Remove check for NONE when isNot is removed
        if (this.isNot && this.operator !== "NONE") {
            return Cypher.not(predicate);
        }

        return predicate;
    }
}

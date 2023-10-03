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
import { Filter } from "../Filter";
import type { CountFilter } from "./CountFilter";
import type { AggregationPropertyFilter } from "./AggregationPropertyFilter";
import type { LogicalFilter } from "../LogicalFilter";
import type { QueryASTContext } from "../../QueryASTContext";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { QueryASTNode } from "../../QueryASTNode";
import { isNestedContext } from "../../../utils/is-nested-context";

export class AggregationFilter extends Filter {
    private relationship: RelationshipAdapter;

    private filters: Array<AggregationPropertyFilter | CountFilter | LogicalFilter> = [];

    private subqueryReturnVariable: Cypher.Variable | undefined;

    constructor(relationship: RelationshipAdapter) {
        super();
        this.relationship = relationship;
    }

    public addFilters(...filter: Array<AggregationPropertyFilter | CountFilter | LogicalFilter>) {
        this.filters.push(...filter);
    }

    public getChildren(): QueryASTNode[] {
        return [...this.filters];
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        if (!isNestedContext(context)) throw new Error("No parent node found!");
        this.subqueryReturnVariable = new Cypher.Variable();
        const relatedEntity = this.relationship.target as any;
        const relatedNode = new Cypher.Node({
            labels: relatedEntity.labels,
        });

        const relationshipTarget = new Cypher.Relationship({
            type: this.relationship.type,
        });

        const pattern = new Cypher.Pattern(context.target)
            .withoutLabels()
            .related(relationshipTarget)
            .withDirection(this.relationship.getCypherDirection())
            .to(relatedNode);

        const nestedContext = context.push({
            target: relatedNode,
            relationship: relationshipTarget,
        });

        const predicates = Cypher.and(...this.filters.map((f) => f.getPredicate(nestedContext)));

        const returnColumns: Cypher.ProjectionColumn[] = [];

        if (predicates) {
            returnColumns.push([predicates, this.subqueryReturnVariable]);
        }

        if (returnColumns.length === 0) return []; // Maybe throw?

        const subquery = new Cypher.Match(pattern).return(...returnColumns);

        return [subquery];
    }

    public getPredicate(_queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        if (!this.subqueryReturnVariable) return undefined;
        return Cypher.eq(this.subqueryReturnVariable, Cypher.true);
    }
}

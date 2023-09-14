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
import type { QueryASTContext } from "../../QueryASTContext";
import { RelationshipFilter } from "../RelationshipFilter";
import { Memoize } from "typescript-memoize";
import type { QueryASTNode } from "../../QueryASTNode";

export class AuthRelationshipFilter extends RelationshipFilter {
    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const relatedNode = this.relatedNode;
        const relVar = this.relationshipVar;

        const nestedContext = context.push({
            target: relatedNode,
            relationship: relVar,
        });

        const pattern = this.getPattern(nestedContext);

        if (!this.relationship.isList && this.relationship.isNullable) {
            return [];
        }
        return [new Cypher.OptionalMatch(pattern).with("*", [Cypher.count(nestedContext.target), this.countVariable])];
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        // if version>5 super.getPredicate(), due to limitations with Exists operation in neo4j 4

        const nestedContext = queryASTContext.push({
            relationship: this.relationshipVar,
            target: this.relatedNode,
        });

        const innerPredicates = this.targetNodeFilters.map((c) => c.getPredicate(nestedContext));
        let innerPredicate = Cypher.and(...innerPredicates);
        if (innerPredicate) {
            innerPredicate = this.wrapInNotIfNeeded(innerPredicate);
        }

        if (!this.relationship.isList && this.relationship.isNullable) {
            const pattern = this.getPattern(nestedContext);

            const comprehension = new Cypher.PatternComprehension(pattern, new Cypher.Literal(1));
            if (innerPredicate) comprehension.where(innerPredicate);
            return Cypher.single(nestedContext.target, comprehension, Cypher.true);
        }

        return Cypher.and(Cypher.neq(this.countVariable, new Cypher.Literal(0)), innerPredicate);
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    @Memoize()
    private get relatedNode(): Cypher.Node {
        const relatedEntity = this.relationship.target as any;
        return new Cypher.Node({
            labels: relatedEntity.labels,
        });
    }

    @Memoize()
    private get relationshipVar(): Cypher.Relationship {
        return new Cypher.Relationship({
            type: this.relationship.type,
        });
    }

    private getPattern(context: QueryASTContext): Cypher.Pattern {
        return new Cypher.Pattern(context.source as Cypher.Node)
            .withoutLabels()
            .related(context.relationship)
            .withDirection(this.relationship.getCypherDirection())
            .withoutVariable()
            .to(context.target);
    }
}

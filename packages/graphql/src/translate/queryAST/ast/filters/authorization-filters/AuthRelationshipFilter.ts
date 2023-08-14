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
import { QueryASTContext } from "../../QueryASTContext";
import { RelationshipFilter } from "../RelationshipFilter";
import type { ConcreteEntity } from "../../../../../schema-model/entity/ConcreteEntity";

export class AuthRelationshipFilter extends RelationshipFilter {
    private countVar = new Cypher.Variable();

    public getSubqueries(_parentNode: Cypher.Node): Cypher.Clause[] {
        const relatedEntity = this.relationship.target as ConcreteEntity;
        const relatedNode = new Cypher.Node({
            labels: relatedEntity.labels,
        });
        const relVar = new Cypher.Relationship({
            type: this.relationship.type,
        });

        const nestedContext = new QueryASTContext({
            target: relatedNode,
            relationship: relVar,
            source: _parentNode,
        });

        //TODO: not concrete entities

        const pattern = new Cypher.Pattern(nestedContext.source as Cypher.Node)
            .withoutLabels()
            .related(nestedContext.relationship)
            .withDirection(this.relationship.getCypherDirection())
            .withoutVariable()
            .to(nestedContext.target);

        return [new Cypher.OptionalMatch(pattern).with("*", [Cypher.count(nestedContext.target), this.countVar])];
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        // if version>5 super.getPredicate()

        //

        const innerPredicates = this.targetNodeFilters.map((c) => c.getPredicate(queryASTContext));
        let innerPredicate = Cypher.and(...innerPredicates);
        if (innerPredicate) {
            innerPredicate = this.wrapInNotIfNeeded(innerPredicate);
        }

        return Cypher.and(Cypher.neq(this.countVar, new Cypher.Literal(0)), innerPredicate);
    }
}

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

import Cypher, { NamedVariable } from "@neo4j/cypher-builder";
import { RELATIONSHIP_REQUIREMENT_PREFIX } from "../constants";
import type { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { filterTruthy } from "../utils/utils";
import { createNodeFromEntity } from "./queryAST/utils/create-node-from-entity";
import { isInterfaceEntity } from "./queryAST/utils/is-interface-entity";
import { isUnionEntity } from "./queryAST/utils/is-union-entity";

/**
 * Generate cardinality validation as the legacy method create-relationship-validation-string.ts but it uses CypherBuilder and the Schema Model
 **/
export function createRelationshipValidationClauses({
    entity,
    context,
    varName,
    relationshipFieldNotOverwritable,
}: {
    entity: ConcreteEntityAdapter;
    context: Neo4jGraphQLTranslationContext;
    varName: string;
    relationshipFieldNotOverwritable?: string;
}): Cypher.Clause[] {
    return filterTruthy(
        [...entity.relationships.values()].map((relationship) => {
            const target = relationship.target;
            if (isInterfaceEntity(target) || isUnionEntity(target)) {
                return;
            }
            const relVarname = `${varName}_${relationship.name}_${target.name}_unique`;
            const relVarnameCypher = new Cypher.NamedRelationship(relVarname, {
                type: relationship.type,
            });
            const varNameNode = new Cypher.NamedNode(varName);
            const direction = relationship.getCypherDirection();
            const predicateAndMessage = getCardinalityPredicateAndMessage(
                relationship,
                entity,
                relationshipFieldNotOverwritable
            );
            if (!predicateAndMessage) {
                return;
            }
            const [predicate, errorMsg] = predicateAndMessage;
            const cVariable = new NamedVariable("c");
            const predicateCypher = Cypher.not(predicate);
            const relVarNameIgnored = new Cypher.NamedVariable(`${relVarname}_ignored`);
            const source = createNodeFromEntity(entity, context, varName);
            const cypherNodeTarget = createNodeFromEntity(target, context);
            const returnVar = relationship.isList ? Cypher.collect(cVariable) : cVariable;
            const match = new Cypher.Match(
                new Cypher.Pattern(source)
                    .withoutLabels()
                    .related(relVarnameCypher)
                    .withDirection(direction)
                    .to(cypherNodeTarget)
                    .withoutVariable()
            )
                .with([Cypher.count(relVarnameCypher), cVariable])
                .where(Cypher.apoc.util.validatePredicate(predicateCypher, errorMsg))
                .return([returnVar, relVarNameIgnored]);
            return new Cypher.Call(match).importWith(varNameNode);
        })
    );
}

function getCardinalityPredicateAndMessage(
    relationship: RelationshipAdapter,
    entity: ConcreteEntityAdapter,
    relationshipFieldNotOverwritable: string | undefined
): [Cypher.Predicate, string] | undefined {
    if (
        (relationship.isList && relationshipFieldNotOverwritable === relationship.name) ||
        (!relationship.isList && !relationship.isNullable)
    ) {
        return [
            Cypher.eq(new NamedVariable("c"), new Cypher.Literal(1)),
            `${RELATIONSHIP_REQUIREMENT_PREFIX}${entity.name}.${relationship.name} required exactly once`,
        ];
    } else if (!relationship.isList && relationship.isNullable) {
        return [
            Cypher.lte(new NamedVariable("c"), new Cypher.Literal(1)),
            `${RELATIONSHIP_REQUIREMENT_PREFIX}${entity.name}.${relationship.name} must be less than or equal to one`,
        ];
    }
}

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

import type { Node } from "../classes";
import { RELATIONSHIP_REQUIREMENT_PREFIX } from "../constants";
import type { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { mapLabelsWithContext } from "../schema-model/utils/map-labels-with-context";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { isInterfaceEntity } from "./queryAST/utils/is-interface-entity";
import { isUnionEntity } from "./queryAST/utils/is-union-entity";

export function createRelationshipValidationString({
    node,
    context,
    varName,
    relationshipFieldNotOverwritable,
}: {
    node: Node;
    context: Neo4jGraphQLTranslationContext;
    varName: string;
    relationshipFieldNotOverwritable?: string;
}): string {
    const strs: string[] = [];

    node.relationFields.forEach((field) => {
        const isArray = field.typeMeta.array;
        const isUnionOrInterface = Boolean(field.union) || Boolean(field.interface);
        if (isUnionOrInterface) {
            return;
        }

        const toNode = context.nodes.find((n) => n.name === field.typeMeta.name) as Node;
        const inStr = field.direction === "IN" ? "<-" : "-";
        const outStr = field.direction === "OUT" ? "->" : "-";
        const relVarname = `${varName}_${field.fieldName}_${toNode.name}_unique`;

        let predicate: string;
        let errorMsg: string;
        let subQuery: string | undefined;
        if (isArray) {
            if (relationshipFieldNotOverwritable === field.fieldName) {
                predicate = `c = 1`;
                errorMsg = `${RELATIONSHIP_REQUIREMENT_PREFIX}${node.name}.${field.fieldName} required exactly once for a specific ${toNode.name}`;
                subQuery = [
                    `CALL {`,
                    `\tWITH ${varName}`,
                    `\tMATCH (${varName})${inStr}[${relVarname}:${field.type}]${outStr}(other${toNode.getLabelString(
                        context
                    )})`,
                    `\tWITH count(${relVarname}) as c, other`,
                    `\tWHERE apoc.util.validatePredicate(NOT (${predicate}), '${errorMsg}', [0])`,
                    `\tRETURN collect(c) AS ${relVarname}_ignored`,
                    `}`,
                ].join("\n");
            }
        } else {
            predicate = `c = 1`;
            errorMsg = `${RELATIONSHIP_REQUIREMENT_PREFIX}${node.name}.${field.fieldName} required exactly once`;
            if (!field.typeMeta.required) {
                predicate = `c <= 1`;
                errorMsg = `${RELATIONSHIP_REQUIREMENT_PREFIX}${node.name}.${field.fieldName} must be less than or equal to one`;
            }

            subQuery = [
                `CALL {`,
                `\tWITH ${varName}`,
                `\tMATCH (${varName})${inStr}[${relVarname}:${field.type}]${outStr}(${toNode.getLabelString(context)})`,
                `\tWITH count(${relVarname}) as c`,
                `\tWHERE apoc.util.validatePredicate(NOT (${predicate}), '${errorMsg}', [0])`,
                `\tRETURN c AS ${relVarname}_ignored`,
                `}`,
            ].join("\n");
        }

        if (subQuery) {
            strs.push(subQuery);
        }
    });

    return strs.join("\n");
}

export function createRelationshipValidationStringUsingSchemaModel({
    entity,
    context,
    varName,
    relationshipFieldNotOverwritable,
}: {
    entity: ConcreteEntityAdapter;
    context: Neo4jGraphQLTranslationContext;
    varName: string;
    relationshipFieldNotOverwritable?: string;
}): string {
    const strs: string[] = [];

    entity.relationships.forEach((relationship) => {
        const target = relationship.target;
        if (isInterfaceEntity(target) || isUnionEntity(target)) {
            return;
        }
        const relVarname = `${varName}_${relationship.name}_${target.name}_unique`;

        let predicate: string;
        let errorMsg: string;
        let subQuery: string | undefined;
        const nodeLabels = target.getLabels();
        const labels = mapLabelsWithContext(nodeLabels, context);
        const direction = relationship.direction;
        const inStr = direction === "IN" ? "<-" : "-";
        const outStr = direction === "OUT" ? "->" : "-";
        if (relationship.isList) {
            if (relationshipFieldNotOverwritable === relationship.name) {
                predicate = `c = 1`;
                errorMsg = `${RELATIONSHIP_REQUIREMENT_PREFIX}${entity.name}.${relationship.name} required exactly once for a specific ${target.name}`;
                subQuery = [
                    `CALL {`,
                    `\tWITH ${varName}`,
                    `\tMATCH (${varName})${inStr}[${relVarname}:${relationship.type}]${outStr}(other:${labels})`,
                    `\tWITH count(${relVarname}) as c, other`,
                    `\tWHERE apoc.util.validatePredicate(NOT (${predicate}), '${errorMsg}', [0])`,
                    `\tRETURN collect(c) AS ${relVarname}_ignored`,
                    `}`,
                ].join("\n");
            }
        } else {
            predicate = `c = 1`;
            errorMsg = `${RELATIONSHIP_REQUIREMENT_PREFIX}${entity.name}.${relationship.name} required exactly once`;
            if (relationship.isNullable) {
                predicate = `c <= 1`;
                errorMsg = `${RELATIONSHIP_REQUIREMENT_PREFIX}${entity.name}.${relationship.name} must be less than or equal to one`;
            }

            subQuery = [
                `CALL {`,
                `\tWITH ${varName}`,
                `\tMATCH (${varName})${inStr}[${relVarname}:${relationship.type}]${outStr}(:${labels})`,
                `\tWITH count(${relVarname}) as c`,
                `\tWHERE apoc.util.validatePredicate(NOT (${predicate}), '${errorMsg}', [0])`,
                `\tRETURN c AS ${relVarname}_ignored`,
                `}`,
            ].join("\n");
        }

        if (subQuery) {
            strs.push(subQuery);
        }
    });

    return strs.join("\n");
}

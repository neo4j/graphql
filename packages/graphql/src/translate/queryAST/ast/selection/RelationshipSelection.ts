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
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { hasTarget } from "../../utils/context-has-target";
import { createNodeFromEntity, createRelationshipFromEntity } from "../../utils/create-node-from-entity";
import type { QueryASTContext } from "../QueryASTContext";
import { EntitySelection, type SelectionClause } from "./EntitySelection";
import { READ_LOWER_TARGET_INTERFACE_ENABLED } from "../operations/optimizationSettings";

export class RelationshipSelection extends EntitySelection {
    private relationship: RelationshipAdapter;
    // Overrides relationship target for composite entities
    private targetOverride: ConcreteEntityAdapter | undefined;
    private alias: string | undefined;
    private directed: boolean;
    private optional: boolean;

    constructor({
        relationship,
        alias,
        directed,
        targetOverride,
        optional,
    }: {
        relationship: RelationshipAdapter;
        alias?: string;
        directed?: boolean;
        targetOverride?: ConcreteEntityAdapter;
        optional?: boolean;
    }) {
        super();
        this.relationship = relationship;
        this.alias = alias;
        this.directed = directed ?? true;
        this.targetOverride = targetOverride;
        this.optional = optional ?? false;
    }

    public apply(context: QueryASTContext<Cypher.Node>): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        if (!hasTarget(context)) throw new Error("No parent node over a nested relationship match!");
        const relVar = createRelationshipFromEntity(this.relationship);

        const relationshipTarget = this.targetOverride ?? this.relationship.target;
        const relDirection = this.relationship.getCypherDirection(this.directed);

        const lowerToTargetType = READ_LOWER_TARGET_INTERFACE_ENABLED
            ? context.neo4jGraphQLContext.labelManager?.getLowerTargetInterfaceIfSafeRelationship(
                  this.relationship.source.name,
                  this.relationship.name
              )
            : null;

        const targetNode =
            lowerToTargetType && context.neo4jGraphQLContext.labelManager
                ? new Cypher.Node({
                      labels: context.neo4jGraphQLContext.labelManager.getLabelSelectorExpressionObject(
                          lowerToTargetType
                      ),
                  })
                : createNodeFromEntity(relationshipTarget, context.neo4jGraphQLContext, this.alias);

        const pattern = new Cypher.Pattern(context.target)
            .withoutLabels()
            .related(relVar)
            .withDirection(relDirection)
            .to(targetNode);

        // NOTE: Direction not passed (can we remove it from context?)
        const nestedContext = context.push({ target: targetNode, relationship: relVar });
        const match = new Cypher.Match(pattern);
        if (this.optional) {
            match.optional();
        }
        return {
            nestedContext: nestedContext,
            selection: match,
        };
    }
}

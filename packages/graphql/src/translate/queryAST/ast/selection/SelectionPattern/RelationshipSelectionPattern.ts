/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { EntityAdapter } from "../../../../../schema-model/entity/EntityAdapter";
import type { ConcreteEntityAdapter } from "../../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { hasTarget } from "../../../utils/context-has-target";
import { getEntityLabels } from "../../../utils/create-node-from-entity";
import type { QueryASTContext } from "../../QueryASTContext";
import { SelectionPattern } from "./SelectionPattern";

export class RelationshipSelectionPattern extends SelectionPattern {
    private relationship: RelationshipAdapter;
    // Overrides relationship target for composite entities
    private targetOverride: ConcreteEntityAdapter | undefined;
    private alias: string | undefined;

    constructor({
        relationship,
        alias,
        targetOverride,
    }: {
        relationship: RelationshipAdapter;
        alias?: string;
        directed?: boolean;
        targetOverride?: ConcreteEntityAdapter;
    }) {
        super();
        this.relationship = relationship;
        this.alias = alias;
        this.targetOverride = targetOverride;
    }

    public print(): string {
        return `${super.print()} <${this.relationship.name} -> ${this.target.name}>`;
    }

    public apply(context: QueryASTContext<Cypher.Node>): {
        nestedContext: QueryASTContext<Cypher.Node>;
        pattern: Cypher.Pattern;
    } {
        if (!hasTarget(context)) throw new Error("No parent node over a nested relationship match!");
        const relVar = new Cypher.Relationship();

        const relationshipTarget = this.target;
        const targetNode = new Cypher.Node();
        const labels = getEntityLabels(relationshipTarget, context.neo4jGraphQLContext);
        const relDirection = this.relationship.getCypherDirection();

        const pattern = new Cypher.Pattern(context.target)
            .related(relVar, { direction: relDirection, type: this.relationship.type })
            .to(targetNode, { labels });
        // NOTE: Direction not passed (can we remove it from context?)
        const nestedContext = context.push({ target: targetNode, relationship: relVar });

        return {
            nestedContext: nestedContext,
            pattern: pattern,
        };
    }

    private get target(): EntityAdapter {
        return this.targetOverride ?? this.relationship.target;
    }
}

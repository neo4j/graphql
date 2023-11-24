import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { hasTarget } from "../../utils/context-has-target";
import { createNodeFromEntity, createRelationshipFromEntity } from "../../utils/create-node-from-entity";
import type { QueryASTContext } from "../QueryASTContext";
import { EntitySelection, type SelectionClause } from "./EntitySelection";

export class RelationshipSelection extends EntitySelection {
    private relationship: RelationshipAdapter;
    // Overrides relationship target for composite entities
    private targetOverride: ConcreteEntityAdapter | undefined;
    private alias: string | undefined;
    private directed: boolean;

    constructor({
        relationship,
        alias,
        directed,
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
        this.directed = directed ?? true;
        this.targetOverride = targetOverride;
    }

    public apply(context: QueryASTContext<Cypher.Node>): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        if (!hasTarget(context)) throw new Error("No parent node over a nested relationship match!");
        const relVar = createRelationshipFromEntity(this.relationship);

        const relationshipTarget = this.targetOverride ?? this.relationship.target;
        const targetNode = createNodeFromEntity(relationshipTarget, context.neo4jGraphQLContext, this.alias);
        const relDirection = this.relationship.getCypherDirection(this.directed);

        const pattern = new Cypher.Pattern(context.target)
            .withoutLabels()
            .related(relVar)
            .withDirection(relDirection)
            .to(targetNode);

        // NOTE: Direction not passed (can we remove it from context?)
        const nestedContext = context.push({ target: targetNode, relationship: relVar });
        return {
            nestedContext: nestedContext,
            selection: new Cypher.Match(pattern),
        };
    }
}

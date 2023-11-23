import Cypher from "@neo4j/cypher-builder";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { hasTarget } from "../../utils/context-has-target";
import { createNodeFromEntity, createRelationshipFromEntity } from "../../utils/create-node-from-entity";
import type { QueryASTContext } from "../QueryASTContext";
import { EntitySelection, type SelectionClause } from "./EntitySelection";

export class RelationshipSelection extends EntitySelection {
    private target: RelationshipAdapter;
    private alias: string | undefined;
    private directed: boolean;

    constructor({ target, alias, directed }: { target: RelationshipAdapter; alias?: string; directed?: boolean }) {
        super();
        this.target = target;
        this.alias = alias;
        this.directed = directed ?? true;
    }

    public apply(context: QueryASTContext<Cypher.Node>): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        if (!hasTarget(context)) throw new Error("No parent node over a nested relationship match!");
        const relVar = createRelationshipFromEntity(this.target);
        const targetNode = createNodeFromEntity(this.target.target, context.neo4jGraphQLContext, this.alias);
        const relDirection = this.target.getCypherDirection(this.directed);

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

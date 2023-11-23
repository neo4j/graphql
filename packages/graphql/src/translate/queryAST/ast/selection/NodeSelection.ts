import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { createNodeFromEntity } from "../../utils/create-node-from-entity";
import { QueryASTContext } from "../QueryASTContext";
import { EntitySelection, type SelectionClause } from "./EntitySelection";

export class NodeSelection extends EntitySelection {
    private target: ConcreteEntityAdapter;
    private alias: string | undefined;

    constructor({ target, alias }: { target: ConcreteEntityAdapter; alias?: string }) {
        super();
        this.target = target;
        this.alias = alias;
    }

    public apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        const node = createNodeFromEntity(this.target, context.neo4jGraphQLContext, this.alias);

        return {
            selection: new Cypher.Match(node),
            nestedContext: new QueryASTContext({
                target: node,
                neo4jGraphQLContext: context.neo4jGraphQLContext,
                returnVariable: context.returnVariable,
            }),
        };
    }
}

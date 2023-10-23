import type { EntityAdapter } from "../schema-model/entity/EntityAdapter";
import type { Node } from "../types";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";

export function getEntityAdapterFromNode(node: Node, context: Neo4jGraphQLTranslationContext): EntityAdapter {
    const entity = context.schemaModel.getConcreteEntityAdapter(node.name);
    if (!entity) {
        throw new Error(`Could not find entity for node ${node.name}`);
    }
    return entity;
}

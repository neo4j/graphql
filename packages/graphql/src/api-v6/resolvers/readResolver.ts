import type { GraphQLResolveInfo } from "graphql";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import { execute } from "../../utils";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";
import { translateReadOperation } from "../translators/translate-read-operation";
import { mapConnectionRecord } from "./mappers/connection-operation-mapper";

export function generateReadResolver({ entity }: { entity: ConcreteEntity }) {
    return async function resolve(
        _root: any,
        args: any,
        context: Neo4jGraphQLTranslationContext,
        info: GraphQLResolveInfo
    ) {
        const resolveTree = getNeo4jResolveTree(info, { args });
        context.resolveTree = resolveTree;

        const { cypher, params } = translateReadOperation({
            context: context,
            entity,
        });
        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
            info,
        });

        return mapConnectionRecord(executeResult);
    };
}

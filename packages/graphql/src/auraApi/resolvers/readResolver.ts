import type { GraphQLResolveInfo } from "graphql";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { Neo4jGraphQLComposedContext } from "../../schema/resolvers/composition/wrap-query-and-mutation";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import { execute } from "../../utils";
import type { ExecuteResult } from "../../utils/execute";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";
import { translateReadOperation } from "../translators/translate-read-operation";

export function generateReadResolver({ entity }: { entity: ConcreteEntity }) {
    return async function resolve(
        _root: any,
        args: any,
        context: Neo4jGraphQLComposedContext,
        info: GraphQLResolveInfo
    ) {
        const resolveTree = getNeo4jResolveTree(info, { args });

        (context as Neo4jGraphQLTranslationContext).resolveTree = resolveTree;

        const { cypher, params } = translateReadOperation({
            context: context as Neo4jGraphQLTranslationContext,
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

function mapConnectionRecord(executionResult: ExecuteResult): any {
    // Note: Connections only return a single record
    const connections = executionResult.records.map((x) => x.this);

    return { connection: connections[0] };
}

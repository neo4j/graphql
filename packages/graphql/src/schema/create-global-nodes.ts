/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLResolveInfo } from "graphql";
import type { ObjectTypeComposerFieldConfigAsObjectDefinition, SchemaComposer } from "graphql-compose";
import { nodeDefinitions } from "graphql-relay";
import type { ConcreteEntity } from "../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jGraphQLComposedContext } from "./resolvers/composition/wrap-query-and-mutation";
import { globalNodeResolver } from "./resolvers/query/global-node";

// returns true if globalNodeFields added or false if not
export function addGlobalNodeFields(composer: SchemaComposer, concreteEntities: ConcreteEntity[]): boolean {
    const globalEntities = concreteEntities.map((e) => new ConcreteEntityAdapter(e)).filter((e) => e.isGlobalNode());

    if (globalEntities.length === 0) return false;

    const fetchById = (id: string, context: Neo4jGraphQLComposedContext, info: GraphQLResolveInfo) => {
        const resolver = globalNodeResolver({ entities: globalEntities });
        return resolver.resolve(null, { id }, context, info);
    };

    const resolveType = (obj: { [key: string]: unknown; __resolveType: string }) => obj.__resolveType;

    const { nodeInterface, nodeField } = nodeDefinitions(fetchById, resolveType);

    composer.createInterfaceTC(nodeInterface);

    composer.Query.addFields({
        node: nodeField as ObjectTypeComposerFieldConfigAsObjectDefinition<
            null,
            Neo4jGraphQLComposedContext,
            { id: string }
        >,
    });
    return true;
}

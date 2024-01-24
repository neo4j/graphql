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

import type { GraphQLResolveInfo } from "graphql";
import type { ObjectTypeComposerFieldConfigAsObjectDefinition, SchemaComposer } from "graphql-compose";
import { nodeDefinitions } from "graphql-relay";
import type { Node } from "../types";
import { globalNodeResolver } from "./resolvers/query/global-node";
import type { Neo4jGraphQLComposedContext } from "./resolvers/composition/wrap-query-and-mutation";
import type { ConcreteEntity } from "../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";

// returns true if globalNodeFields added or false if not
export function addGlobalNodeFields(
    nodes: Node[],
    composer: SchemaComposer,
    concreteEntities: ConcreteEntity[]
): boolean {
    const globalNodes = nodes.filter((n) => n.isGlobalNode);
    const globalEntities = concreteEntities.map((e) => new ConcreteEntityAdapter(e)).filter((e) => e.isGlobalNode());

    if (globalNodes.length === 0) return false;

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

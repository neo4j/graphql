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
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { GlobalNodeArgs } from "../../types";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import { execute } from "../../utils";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";
import { fromGlobalId } from "../../utils/global-ids";
import { parseGlobalNodeResolveInfoTree } from "../queryIRFactory/resolve-tree-parser/parse-global-resolve-info-tree";
import { translateReadOperation } from "../translators/translate-read-operation";

/** Maps the database id field to globalId */
export function generateGlobalNodeResolver({ globalEntities }: { globalEntities: ConcreteEntity[] }) {
    return async function resolve(
        _source,
        args: GlobalNodeArgs,
        context: Neo4jGraphQLTranslationContext,
        info: GraphQLResolveInfo
    ) {
        const resolveTree = getNeo4jResolveTree(info, { args });
        context.resolveTree = resolveTree;

        const { typeName, field, id } = fromGlobalId(args.id);
        if (!typeName || !field || !id) return null;

        const entity = globalEntities.find((n) => n.name === typeName);
        if (!entity) return null;

        const graphQLTree = parseGlobalNodeResolveInfoTree({ resolveTree: context.resolveTree, entity });
        const { cypher, params } = translateReadOperation({
            context: context,
            graphQLTree,
            entity,
        });
        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
            info,
        });

        let obj = null;

        const thisValue = executeResult.records[0]?.this.connection.edges[0].node;

        if (executeResult.records.length && thisValue) {
            obj = { ...thisValue, id: args.id, __resolveType: entity.name };
        }
        return obj;
    };
}

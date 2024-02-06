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
import type { FieldsByTypeName } from "graphql-parse-resolve-info";
import { parseResolveInfo } from "graphql-parse-resolve-info";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { translateRead } from "../../../translate";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { execute } from "../../../utils";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import { fromGlobalId } from "../../../utils/global-ids";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";

export function globalNodeResolver({ entities }: { entities: ConcreteEntityAdapter[] }) {
    async function resolve(
        _root: any,
        args: { id: string },
        context: Neo4jGraphQLComposedContext,
        info: GraphQLResolveInfo
    ) {
        const { typeName, field, id } = fromGlobalId(args.id);

        if (!typeName || !field || !id) return null;

        const entityAdapter = entities.find((n) => n.name === typeName);

        if (!entityAdapter) return null;

        // modify the resolve tree and append the fragment selectionSet
        const parseInfo = parseResolveInfo(info) ?? { fieldsByTypeName: [] };

        const fieldsByTypeName = Object.entries(parseInfo.fieldsByTypeName).reduce((res, [key, value]) => {
            if (key === "Node") return res;

            if (key === typeName) {
                const fields = { ...value, id: { name: "id", alias: "id", args: {}, fieldsByTypeName: {} } };
                return { ...res, [key]: fields };
            }

            return { ...res, [key]: value };
        }, {} as FieldsByTypeName);

        const resolveTree = {
            name: entityAdapter.plural,
            alias: "node",
            args: { where: { [field]: id } },
            fieldsByTypeName,
        };

        (context as Neo4jGraphQLTranslationContext).resolveTree = getNeo4jResolveTree(info, { resolveTree });

        const { cypher, params } = translateRead({
            context: context as Neo4jGraphQLTranslationContext,
            entityAdapter,
            varName: "this",
        });
        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
            info,
        });

        let obj = null;

        const thisValue = executeResult.records[0]?.this;

        if (executeResult.records.length && thisValue) {
            obj = { ...thisValue, id: args.id, __resolveType: entityAdapter.name };
        }

        return obj;
    }
    return {
        type: `Node`,
        resolve,
        args: {
            id: "ID!",
        },
    };
}

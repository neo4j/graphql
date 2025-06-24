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

import type { ResolveTree } from "graphql-parse-resolve-info";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { isRecord } from "../../../../utils/utils";
import { ConnectOperation } from "../../ast/operations/ConnectOperation";
import { NodeSelectionPattern } from "../../ast/selection/SelectionPattern/NodeSelectionPattern";
import type { QueryASTFactory } from "../QueryASTFactory";

export class ConnectFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createConnectOperation(
        entity: ConcreteEntityAdapter,
        relationship: RelationshipAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): ConnectOperation {
        // const responseFields = Object.values(
        //     resolveTree.fieldsByTypeName?.[entity.operations.mutationResponseTypeNames.connect] ?? {}
        // );

        const { whereArg } = this.parseConnectArgs(resolveTree, false); //connectArg

        const nodeFilters = this.queryASTFactory.filterFactory.createNodeFilters(entity, whereArg.node);
        const connectOP = new ConnectOperation({
            target: entity,
            selectionPattern: new NodeSelectionPattern({
                target: entity,
            }),
            filters: nodeFilters,
            relationship,
        });
        // createConnectionPredicates

        // const projectionFields = responseFields
        //     .filter((f) => f.name === entity.plural)
        //     .map((field) => {
        //         const readOP = this.queryASTFactory.operationsFactory.createReadOperation({
        //             entityOrRel: entity,
        //             resolveTree: field,
        //             context,
        //         }) as ReadOperation;
        //         return readOP;
        //     });

        // connectOP.addProjectionOperations(projectionFields);

        // const rawInput = resolveTree.args.input as Record<string, any>[];
        // const input = rawInput ?? [];
        // this.hydrateCreateOperation({
        //     target: entity,
        //     relationship: undefined,
        //     input,
        //     create: connectOP,
        //     context,
        // });
        return connectOP;
    }

    private parseConnectArgs(
        args: Record<string, any>,
        isTopLevel: boolean
    ): {
        whereArg: { node: Record<string, any>; edge: Record<string, any> };
        connectArg: Record<string, any>;
    } {
        let whereArg;
        const rawWhere = isRecord(args.where) ? args.where : {};
        if (isTopLevel) {
            whereArg = { node: rawWhere.node ?? {}, edge: rawWhere.edge ?? {} };
        } else {
            whereArg = { node: rawWhere.node, edge: {} };
        }
        const connectArg = isRecord(args.connect) ? args.connect : {};
        return { whereArg, connectArg };
    }
}

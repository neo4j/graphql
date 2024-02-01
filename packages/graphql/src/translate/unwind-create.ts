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

import Cypher from "@neo4j/cypher-builder";
import Debug from "debug";
import type { Node } from "../classes";
import { CallbackBucket } from "../classes/CallbackBucket";
import { DEBUG_TRANSLATE } from "../constants";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { getTreeDescriptor, mergeTreeDescriptors, parseCreate } from "./batch-create/parser";
import type { GraphQLCreateInput } from "./batch-create/types";
import { UnsupportedUnwindOptimization } from "./batch-create/types";
import { UnwindCreateVisitor } from "./batch-create/unwind-create-visitors/UnwindCreateVisitor";
import { QueryASTContext, QueryASTEnv } from "./queryAST/ast/QueryASTContext";
import { QueryASTFactory } from "./queryAST/factory/QueryASTFactory";

const debug = Debug(DEBUG_TRANSLATE);

export default async function unwindCreate({
    context,
    node,
}: {
    context: Neo4jGraphQLTranslationContext;
    node: Node;
}): Promise<{ cypher: string; params: Record<string, any> }> {
    if (context.subscriptionsEnabled) {
        throw new UnsupportedUnwindOptimization("Unwind create optimization does not yet support subscriptions");
    }
    const { resolveTree } = context;
    const input = resolveTree.args.input as GraphQLCreateInput | GraphQLCreateInput[];
    const treeDescriptor = Array.isArray(input)
        ? mergeTreeDescriptors(input.map((el: GraphQLCreateInput) => getTreeDescriptor(el, node, context)))
        : getTreeDescriptor(input, node, context);
    const createNodeAST = parseCreate(treeDescriptor, node, context);
    const callbackBucket = new CallbackBucket(context);
    const unwindVar = new Cypher.Variable();
    const unwind = new Cypher.Param(input);
    const unwindQuery = new Cypher.Unwind([unwind, unwindVar]);
    const unwindCreateVisitor = new UnwindCreateVisitor(unwindVar, callbackBucket, context);
    createNodeAST.accept(unwindCreateVisitor);
    const [rootNodeVariable, createCypher] = unwindCreateVisitor.build() as [Cypher.Node, Cypher.Clause];
    const entityAdapter = context.schemaModel.getConcreteEntityAdapter(node.name);
    if (!entityAdapter) {
        throw new Error(`Transpilation error: ${node.name} is not a concrete entity`);
    }

    const queryAST = new QueryASTFactory(context.schemaModel).createQueryAST({
        resolveTree,
        entityAdapter,
        context,
    });
    debug(queryAST.print());
    const queryASTEnv = new QueryASTEnv();
    const queryASTContext = new QueryASTContext({
        target: rootNodeVariable,
        env: queryASTEnv,
        neo4jGraphQLContext: context,
        returnVariable: new Cypher.NamedVariable("data"),
        shouldCollect: true,
    });
    const clauses = queryAST.transpile(queryASTContext).clauses;
    const projectionCypher = clauses.length
        ? Cypher.concat(...clauses)
        : new Cypher.Return(new Cypher.Literal("Query cannot conclude with CALL"));

    const unwindCreate = Cypher.concat(unwindQuery, createCypher, projectionCypher);

    const createQueryCypher = unwindCreate.build("create_");
    const { cypher, params: resolvedCallbacks } = await callbackBucket.resolveCallbacksAndFilterCypher({
        cypher: createQueryCypher.cypher,
    });

    return {
        cypher,
        params: {
            ...createQueryCypher.params,
            resolvedCallbacks,
        },
    };
}

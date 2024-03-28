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

import Debug from "debug";
import type { Node } from "../classes";
import { DEBUG_TRANSLATE } from "../constants";
import type { EntityAdapter } from "../schema-model/entity/EntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { QueryASTFactory } from "./queryAST/factory/QueryASTFactory";

const debug = Debug(DEBUG_TRANSLATE);

export default function unwindCreate({
    context,
    entityAdapter,
    node,
}: {
    context: Neo4jGraphQLTranslationContext;
    entityAdapter: EntityAdapter;
    node: Node;
}): { cypher: string; params: Record<string, any> } {
    const { resolveTree } = context;
    // const input = resolveTree.args.input as GraphQLCreateInput | GraphQLCreateInput[];

    /*   const treeDescriptor = mergeTreeDescriptors(
        asArray(input).map((el: GraphQLCreateInput) => getTreeDescriptor(el, node, context))
    );

    const createNodeAST = parseCreate(treeDescriptor, node, context);
    const callbackBucket = new CallbackBucket(context);
    const unwindVar = new Cypher.Variable();
    const unwind = new Cypher.Param(input);
    const unwindQuery = new Cypher.Unwind([unwind, unwindVar]);
    const unwindCreateVisitor = new UnwindCreateVisitor(unwindVar, callbackBucket, context);
    createNodeAST.accept(unwindCreateVisitor);
    const [rootNodeVariable, createCypher] = unwindCreateVisitor.build() as [Cypher.Node, Cypher.Clause];
 */
    const queryAST = new QueryASTFactory(context.schemaModel).createQueryAST({
        resolveTree,
        entityAdapter,
        context,
        resolveAsUnwind: true,
    });
    debug(queryAST.print());
    /*    const queryASTEnv = new QueryASTEnv(); */
    /*     const queryASTContext = new QueryASTContext({
        target: rootNodeVariable,
        env: queryASTEnv,
        neo4jGraphQLContext: context,
        returnVariable: new Cypher.NamedVariable("data"),
        shouldCollect: true,
    }); */
    const clauses = queryAST.build(context);
    /*     const projectionCypher = clauses.length
        ? Cypher.concat(...clauses)
        : new Cypher.Return(new Cypher.Literal("Query cannot conclude with CALL"));
 */
    /*     const unwindCreate = Cypher.concat(unwindQuery, createCypher, projectionCypher);

    const createQueryCypher = unwindCreate.build("create_");
    const { cypher, params: resolvedCallbacks } = await callbackBucket.resolveCallbacksAndFilterCypher({
        cypher: createQueryCypher.cypher,
    }); */
    return clauses.build("create_");
}

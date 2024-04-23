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
import { DEBUG_TRANSLATE, META_CYPHER_VARIABLE } from "../constants";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { compileCypherIfExists } from "../utils/compile-cypher";
import { asArray, filterTruthy } from "../utils/utils";
import createCreateAndParams from "./create-create-and-params";
import { QueryASTContext, QueryASTEnv } from "./queryAST/ast/QueryASTContext";
import { QueryASTFactory } from "./queryAST/factory/QueryASTFactory";
import { isUnwindCreateSupported } from "./queryAST/factory/parsers/is-unwind-create-supported";
import unwindCreate from "./unwind-create";
import { getAuthorizationStatements } from "./utils/get-authorization-statements";

const debug = Debug(DEBUG_TRANSLATE);

export default async function translateCreate({
    context,
    node,
}: {
    context: Neo4jGraphQLTranslationContext;
    node: Node;
}): Promise<{ cypher: string; params: Record<string, any> }> {
    const { resolveTree } = context;
    const mutationInputs = resolveTree.args.input as any[];
    const entityAdapter = context.schemaModel.getConcreteEntityAdapter(node.name);
    if (!entityAdapter) {
        throw new Error(`Transpilation error: ${node.name} is not a concrete entity`);
    }
    const { isSupported, reason } = isUnwindCreateSupported(entityAdapter, asArray(mutationInputs), context);
    if (isSupported) {
        return unwindCreate({ context, entityAdapter });
    }
    debug(`Unwind create optimization not supported: ${reason}`);

    const projectionWith: string[] = [];
    const callbackBucket: CallbackBucket = new CallbackBucket(context);

    const metaNames: string[] = [];
    
    // TODO: after the createCreateAndParams refactor, remove varNameStrs and only use Cypher Variables
    const varNameStrs = mutationInputs.map((_, i) => `this${i}`);
    const varNameVariables = varNameStrs.map((varName) => new Cypher.NamedNode(varName));

    const { createStrs, params } = mutationInputs.reduce(
        (res, input, index) => {
            const varName = varNameStrs[index] as string;
            const create = [`CALL {`];
            const withVars = [varName];
            projectionWith.push(varName);

            if (context.subscriptionsEnabled) {
                create.push(`WITH [] AS ${META_CYPHER_VARIABLE}`);
                withVars.push(META_CYPHER_VARIABLE);
            }

            const {
                create: nestedCreate,
                params,
                authorizationPredicates,
                authorizationSubqueries,
            } = createCreateAndParams({
                input,
                node,
                context,
                varName,
                withVars,
                includeRelationshipValidation: true,
                topLevelNodeVariable: varName,
                callbackBucket,
            });
            create.push(nestedCreate);

            create.push(...getAuthorizationStatements(authorizationPredicates, authorizationSubqueries));

            if (context.subscriptionsEnabled) {
                const metaVariable = `${varName}_${META_CYPHER_VARIABLE}`;
                create.push(`RETURN ${varName}, ${META_CYPHER_VARIABLE} AS ${metaVariable}`);
                metaNames.push(metaVariable);
            } else {
                create.push(`RETURN ${varName}`);
            }

            create.push(`}`);
            res.createStrs.push(create.join("\n"));
            res.params = { ...res.params, ...params };
            return res;
        },
        { createStrs: [], params: {}, withVars: [] }
    ) as {
        createStrs: string[];
        params: any;
    };

    if (metaNames.length > 0) {
        projectionWith.push(`${metaNames.join(" + ")} AS meta`);
    }

    const queryAST = new QueryASTFactory(context.schemaModel).createQueryAST({
        resolveTree,
        entityAdapter,
        context,
    });
    const queryASTEnv = new QueryASTEnv();
    const projectedVariables: Cypher.Node[] = [];
    /**
     * Currently, the create projections are resolved separately for each input,
     * the following block reuses the same ReadOperation for each of the variable names generated during the create operations.
     **/
    const projectionClause = Cypher.concat(
        ...filterTruthy(
            varNameVariables.map((varName): Cypher.Clause | undefined => {
                const queryASTContext = new QueryASTContext({
                    target: varName,
                    env: queryASTEnv,
                    neo4jGraphQLContext: context,
                });
                debug(queryAST.print());
                const queryASTResult = queryAST.transpile(queryASTContext);
                if (queryASTResult.clauses.length) {
                    projectedVariables.push(queryASTResult.projectionExpr as Cypher.Node);
                    const clause = Cypher.concat(...queryASTResult.clauses);
                    return new Cypher.Call(clause).importWith(varName);
                }
            })
        )
    );

    const returnStatement = getReturnStatement(projectedVariables, context);
    const createQuery = new Cypher.Raw((env) => {
        const cypher = filterTruthy([
            `${createStrs.join("\n")}`,
            context.subscriptionsEnabled ? `WITH ${projectionWith.join(", ")}` : "",
            compileCypherIfExists(projectionClause, env),
            compileCypherIfExists(returnStatement, env),
        ])
            .filter(Boolean)
            .join("\n");
        return [
            cypher,
            {
                ...params,
            },
        ];
    });

    const createQueryCypher = createQuery.build("create_");
    const { cypher, params: resolvedCallbacks } = await callbackBucket.resolveCallbacksAndFilterCypher({
        cypher: createQueryCypher.cypher,
    });

    const result = {
        cypher,
        params: {
            ...createQueryCypher.params,
            resolvedCallbacks,
        },
    };

    return result;
}

function getReturnStatement(
    projectedVariables: Cypher.Variable[],
    context: Neo4jGraphQLTranslationContext
): Cypher.Return {
    const ret = new Cypher.Return();
    if (projectedVariables.length) {
        ret.addColumns([new Cypher.List(projectedVariables), new Cypher.NamedVariable("data")]);
    }
    if (context.subscriptionsEnabled) {
        ret.addColumns(new Cypher.NamedVariable("meta"));
    }
    if (!projectedVariables.length && !context.subscriptionsEnabled) {
        ret.addColumns(new Cypher.Literal("Query cannot conclude with CALL"));
    }
    return ret;
}

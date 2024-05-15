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
import type { GraphQLFieldResolver, GraphQLResolveInfo } from "graphql";
import type { Driver } from "neo4j-driver";
import type { Node, Relationship } from "../../../classes";
import { Executor } from "../../../classes/Executor";
import type { Neo4jDatabaseInfo } from "../../../classes/Neo4jDatabaseInfo";
import { getNeo4jDatabaseInfo } from "../../../classes/Neo4jDatabaseInfo";
import type { Neo4jGraphQLAuthorization } from "../../../classes/authorization/Neo4jGraphQLAuthorization";
import { DEBUG_GRAPHQL } from "../../../constants";
import { debugGraphQLResolveInfo } from "../../../debug/debug-graphql-resolve-info";
import { debugObject } from "../../../debug/debug-object";
import type { Neo4jGraphQLSchemaModel } from "../../../schema-model/Neo4jGraphQLSchemaModel";
import type { AuthorizationContext, ContextFeatures, FulltextContext, VectorContext } from "../../../types";
import type { Neo4jGraphQLContext } from "../../../types/neo4j-graphql-context";
import { getAuthorizationContext } from "./utils/get-authorization-context";

const debug = Debug(DEBUG_GRAPHQL);

export type WrapResolverArguments = {
    driver?: Driver;
    nodes: Node[];
    relationships: Relationship[];
    jwtPayloadFieldsMap?: Map<string, string>;
    schemaModel: Neo4jGraphQLSchemaModel;
    dbInfo?: Neo4jDatabaseInfo;
    features: ContextFeatures;
    authorization?: Neo4jGraphQLAuthorization;
};

/**
 * The type describing the context generated by {@link wrapQueryAndMutation}.
 */
export interface Neo4jGraphQLComposedContext extends Neo4jGraphQLContext {
    /**
     * @deprecated The use of this field is now deprecated in favour of {@link schemaModel}.
     */
    nodes: Node[];
    /**
     * @deprecated The use of this field is now deprecated in favour of {@link schemaModel}.
     */
    relationships: Relationship[];
    schemaModel: Neo4jGraphQLSchemaModel;
    features: ContextFeatures;
    subscriptionsEnabled: boolean;
    executor: Executor;
    authorization: AuthorizationContext;
    neo4jDatabaseInfo?: Neo4jDatabaseInfo;
    fulltext?: FulltextContext;
    vector?: VectorContext;
}

let neo4jDatabaseInfo: Neo4jDatabaseInfo;

export const wrapQueryAndMutation =
    ({
        driver,
        nodes,
        relationships,
        jwtPayloadFieldsMap,
        schemaModel,
        dbInfo,
        authorization,
        features,
    }: WrapResolverArguments) =>
    (next: GraphQLFieldResolver<any, Neo4jGraphQLComposedContext>) =>
    async (root, args, context: Neo4jGraphQLContext, info: GraphQLResolveInfo) => {
        debugGraphQLResolveInfo(debug, info);
        debugObject(debug, "incoming context", context);

        if (!context?.executionContext) {
            if (!driver) {
                throw new Error(
                    "A Neo4j driver instance must either be passed to Neo4jGraphQL on construction, or a driver, session or transaction passed as context.executionContext in each request."
                );
            }
            context.executionContext = driver;
        }

        const subscriptionsEnabled = Boolean(features.subscriptions);

        const authorizationContext = await getAuthorizationContext(context, authorization, jwtPayloadFieldsMap);
        if (!context.jwt) {
            context.jwt = authorizationContext.jwt;
        }

        const executor = new Executor({
            executionContext: context.executionContext,
            cypherQueryOptions: context.cypherQueryOptions,
            sessionConfig: context.sessionConfig,
            cypherParams: context.cypherParams,
            transactionMetadata: context.transactionMetadata,
        });

        if (dbInfo) {
            neo4jDatabaseInfo = dbInfo;
        }
        if (!neo4jDatabaseInfo?.version) {
            neo4jDatabaseInfo = await getNeo4jDatabaseInfo(executor);
        }

        const internalContext = {
            nodes,
            relationships,
            schemaModel,
            features,
            subscriptionsEnabled,
            executor,
            authorization: authorizationContext,
        };

        const finalContext = {
            // Some TCK tests override this value to generate version-specific Cypher
            neo4jDatabaseInfo,
            ...context,
            ...internalContext,
        };

        return next(root, args, finalContext, info);
    };

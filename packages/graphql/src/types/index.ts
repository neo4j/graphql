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

import type Cypher from "@neo4j/cypher-builder";
import type { EventEmitter } from "events";
import type { TypeNode } from "graphql";
import type { Directive } from "graphql-compose";
import type { JWTVerifyOptions, RemoteJWKSetOptions } from "jose";
import type { Integer } from "neo4j-driver";
import type { Neo4jGraphQLSubscriptionsCDCEngine } from "../classes/subscription/Neo4jGraphQLSubscriptionsCDCEngine";
import type { Neo4jGraphQLSchemaModel } from "../schema-model/Neo4jGraphQLSchemaModel";
import type { DefaultAnnotationValue } from "../schema-model/annotation/DefaultAnnotation";
import type { FulltextField } from "../schema-model/annotation/FulltextAnnotation";
import type { VectorField } from "../schema-model/annotation/VectorAnnotation";
import type { JwtPayload } from "./jwt-payload";
import type { Neo4jGraphQLContext } from "./neo4j-graphql-context";

export type AuthorizationContext = {
    jwt?: JwtPayload;
    jwtParam: Cypher.Param;
    isAuthenticated: boolean;
    isAuthenticatedParam: Cypher.Param;
    claims?: Map<string, string>;
};

export type FulltextContext = {
    index: FulltextField;
    queryName: string;
    queryType: string;
    scoreVariable: Cypher.Variable;
};

export type VectorContext = {
    index: VectorField;
    queryName: string;
    queryType: string;
    scoreVariable: Cypher.Variable;
    vectorSettings: Neo4jVectorSettings;
};

/**
 * Metadata about a field.type on either
 * FieldDefinitionNode or InputValueDefinitionNode.
 */
export interface TypeMeta {
    name: string;
    array?: boolean;
    required: boolean;
    pretty: string;
    input: {
        where: {
            type: string;
            pretty: string;
        };
        create: {
            type: string;
            pretty: string;
        };
        update: {
            type: string;
            pretty: string;
        };
    };
    originalType?: TypeNode;
}

export type SortDirection = "ASC" | "DESC";

export interface GraphQLSortArg {
    [field: string]: SortDirection;
}

export interface NestedGraphQLSortArg {
    [field: string]: GraphQLSortArg;
}

export interface ConnectionSortArg {
    node?: GraphQLSortArg;
    edge?: GraphQLSortArg;
}

export interface ConnectionQueryArgs {
    where?: ConnectionWhereArg;
    first?: number;
    after?: string;
    sort?: ConnectionSortArg[];
}

/**
 * Representation of the options arg
 * passed to resolvers.
 */
export interface GraphQLSortingAndPaginationArgs {
    limit?: number | Integer;
    offset?: number | Integer;
    sort?: GraphQLSortArg[];
}

/**
 * Representation of the where arg
 * passed to resolvers.
 */
export interface GraphQLWhereArg {
    [k: string]: any;
    AND?: GraphQLWhereArg[];
    OR?: GraphQLWhereArg[];
    NOT?: GraphQLWhereArg;
}

export interface ConnectionWhereArg {
    node?: GraphQLWhereArg;
    edge?: GraphQLWhereArg;
    AND?: ConnectionWhereArg[];
    OR?: ConnectionWhereArg[];
    NOT?: ConnectionWhereArg;
}

/*
  Object keys and enum values map to values at https://neo4j.com/docs/cypher-manual/current/query-tuning/query-options/#cypher-query-options
*/
export interface CypherQueryOptions {
    /**
     * Configure the runtime used: {@link https://neo4j.com/docs/cypher-manual/current/planning-and-tuning/runtimes/concepts | Cypher Runtimes}
     * "interpreted" runtime option is deprecated.
     */
    runtime?: "interpreted" | "slotted" | "pipelined" | "parallel";
    planner?: "cost" | "idp" | "dp";
    updateStrategy?: "default" | "eager";
    expressionEngine?: "default" | "interpreted" | "compiled";
    operatorEngine?: "default" | "interpreted" | "compiled";
    interpretedPipesFallback?: "default" | "disabled" | "whitelisted_plans_only" | "all";
    replan?: "default" | "force" | "skip";
    addVersionPrefix?: boolean;
}

/** Input field for graphql-compose */
export type InputField = { type: string; defaultValue?: DefaultAnnotationValue; directives?: Directive[] } | string;

export type NodeSubscriptionsEvent =
    | {
          event: "create";
          typename: string;
          properties: {
              old: undefined;
              new: Record<string, any>;
          };
          id: string;
          timestamp: number;
      }
    | {
          event: "update";
          typename: string;
          properties: {
              old: Record<string, any>;
              new: Record<string, any>;
          };
          id: string;
          timestamp: number;
      }
    | {
          event: "delete";
          typename: string;
          properties: {
              old: Record<string, any>;
              new: undefined;
          };
          id: string;
          timestamp: number;
      };

/** Serialized subscription event */
export type SubscriptionsEvent = NodeSubscriptionsEvent;

export type SubscriptionEngineContext = {
    schemaModel: Neo4jGraphQLSchemaModel;
};

/** Defines a custom mechanism to transport subscription events internally between servers */
export interface Neo4jGraphQLSubscriptionsEngine {
    events: EventEmitter;

    /** To be called, if needed, in getSchema */
    init?(context: SubscriptionEngineContext): Promise<void>;

    /** Stops subscription */
    close(): void;
}

export type CallbackReturnValue = string | number | boolean | undefined | null | Array<CallbackReturnValue>;

export type Neo4jGraphQLCallback = (
    parent: Record<string, unknown> | undefined,
    args: Record<string, never>,
    context: Neo4jGraphQLContext & { populatedByOperation: "CREATE" | "UPDATE" }
) => CallbackReturnValue | Promise<CallbackReturnValue>;

export type Neo4jGraphQLCallbacks = Record<string, Neo4jGraphQLCallback>;

export interface Neo4jStringFiltersSettings {
    GT?: boolean;
    GTE?: boolean;
    LT?: boolean;
    LTE?: boolean;
    MATCHES?: boolean;
    CASE_INSENSITIVE?: boolean;
}

export interface Neo4jIDFiltersSettings {
    MATCHES?: boolean;
}

export interface Neo4jFiltersSettings {
    String?: Neo4jStringFiltersSettings;
    ID?: Neo4jIDFiltersSettings;
}

export interface Neo4jPopulatedBySettings {
    callbacks?: Neo4jGraphQLCallbacks;
}
export interface Neo4jAuthorizationSettings {
    key: Key | ((context: Neo4jGraphQLContext) => Key);
    verify?: boolean;
    verifyOptions?: JWTVerifyOptions;
}

export interface Neo4jVectorSettings {
    ["VertexAI"]?: {
        token: string; // API access token.
        projectId: string; // GCP project ID.
        model?: string; // The name of the model you want to invoke.
        region?: string; // GCP region where to send the API requests.
    };
    ["OpenAI"]?: {
        token: string; // API access token.
        model?: string; // The name of the model you want to invoke.
        dimensions?: number; // The number of dimensions you want to reduce the vector to. Only supported for certain models.
    };
    ["AzureOpenAI"]?: {
        token: string; // API access token.
        resource: string; // The name of the resource to which the model has been deployed.
        deployment: string; // The name of the model deployment.
    };
    ["Bedrock"]?: {
        accessKeyId: string; // AWS access key ID.
        secretAccessKey: string; // AWS secret key.
        model?: string; // The name of the model you want to invoke.
        region?: string; // AWS region where to send the API requests.
    };
}

export interface RemoteJWKS {
    url: string | URL;
    options?: RemoteJWKSetOptions;
}
export type Key = string | RemoteJWKS;

/** Options to enable extra capabilities on @neo4j/graphql API */
export type Neo4jFeaturesSettings = {
    filters?: Neo4jFiltersSettings;
    populatedBy?: Neo4jPopulatedBySettings;
    authorization?: Neo4jAuthorizationSettings;
    subscriptions?: boolean | Neo4jGraphQLSubscriptionsCDCEngine;
    /** If set to `true`, removes `@neo4j/graphql` fields that are marked as deprecated to reduce schema size.
     *
     * NOTE: this will not remove user defined deprecated fields
     **/

    excludeDeprecatedFields?: {
        mutationOperations?: boolean;
        aggregationFilters?: boolean;
        aggregationFiltersOutsideConnection?: boolean;
        relationshipFilters?: boolean;
        attributeFilters?: boolean;
    };

    /** Options for disabling automatic escaping of potentially unsafe strings.
     *
     * **WARNING**: Changing these options may lead to code injection and unsafe Cypher.
     */
    unsafeEscapeOptions?: {
        /** Disables automatic escaping of node labels.
         *
         * **WARNING**: Disabling label escaping may lead to code injection and unsafe Cypher.
         */
        disableNodeLabelEscaping?: boolean;
        /** Disables automatic escaping of relationship types.
         *
         * **WARNING**: Disabling type escaping may lead to code injection and unsafe Cypher.
         */
        disableRelationshipTypeEscaping?: boolean;
    };
    vector?: Neo4jVectorSettings;
    limitRequired?: boolean;
    complexityEstimators?: boolean;
};

/** Parsed features used in context */
export type ContextFeatures = Neo4jFeaturesSettings & {
    subscriptionsEngine?: Neo4jGraphQLSubscriptionsEngine;
};

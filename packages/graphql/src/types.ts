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

import type { EventEmitter } from "events";
import type { InputValueDefinitionNode, DirectiveNode, TypeNode, GraphQLSchema } from "graphql";
import type { ResolveTree } from "graphql-parse-resolve-info";
import type { Driver, Integer, Session, Transaction } from "neo4j-driver";
import type Cypher from "@neo4j/cypher-builder";
import type { Node, Relationship } from "./classes";
import type { Neo4jDatabaseInfo } from "./classes/Neo4jDatabaseInfo";
import type { RelationshipQueryDirectionOption } from "./constants";
import type { Executor } from "./classes/Executor";
import type { Directive } from "graphql-compose";
import type { Neo4jGraphQLSchemaModel } from "./schema-model/Neo4jGraphQLSchemaModel";

export { Node } from "./classes";

export type DriverConfig = {
    database?: string;
    bookmarks?: string | string[];
};

export interface AuthContext {
    isAuthenticated: boolean;
    roles: string[];
    bindPredicate?: "any" | "all";
    jwt?: JwtPayload;
}

export interface Context {
    driver?: Driver;
    driverConfig?: DriverConfig;
    resolveTree: ResolveTree;
    neo4jDatabaseInfo: Neo4jDatabaseInfo;
    nodes: Node[];
    relationships: Relationship[];
    schemaModel: Neo4jGraphQLSchemaModel;
    schema: GraphQLSchema;
    auth?: AuthContext;
    callbacks?: Neo4jGraphQLCallbacks;
    plugins?: Neo4jGraphQLPlugins;
    jwt?: JwtPayload;
    subscriptionsEnabled: boolean;
    executionContext: Driver | Session | Transaction;
    executor: Executor;
    [k: string]: any;
}

export interface BaseAuthRule {
    isAuthenticated?: boolean;
    allowUnauthenticated?: boolean;
    allow?: { [k: string]: any } | "*";
    bind?: { [k: string]: any } | "*";
    where?: { [k: string]: any } | "*";
    roles?: string[];
    AND?: BaseAuthRule[];
    OR?: BaseAuthRule[];
}

export interface AuthRule extends BaseAuthRule {
    operations?: AuthOperations[];
}

export interface Auth {
    rules: AuthRule[];
    type: "JWT";
}

export type FulltextIndex = {
    name: string | undefined;
    fields: string[];
    queryType: string;
    queryName: string | undefined;
    indexName: string | undefined; // TODO: not undefined once name is removed.
};

export type FullText = {
    indexes: FulltextIndex[];
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

export interface Unique {
    constraintName: string;
}

export interface Callback {
    operations: CallbackOperations[];
    callbackName: string;
}

/**
 * Representation a ObjectTypeDefinitionNode field.
 */
export interface BaseField {
    fieldName: string;
    typeMeta: TypeMeta;
    otherDirectives: DirectiveNode[];
    arguments: InputValueDefinitionNode[];
    private?: boolean;
    auth?: Auth;
    description?: string;
    readonly?: boolean;
    writeonly?: boolean;
    dbPropertyName?: string;
    unique?: Unique;
}

/**
 * Representation of the `@relationship` directive and its meta.
 */
export interface RelationField extends BaseField {
    direction: "OUT" | "IN";
    type: string;
    connectionPrefix?: string;
    inherited: boolean;
    properties?: string;
    union?: UnionField;
    interface?: InterfaceField;
    queryDirection: RelationshipQueryDirectionOption;
}

export interface ConnectionField extends BaseField {
    relationship: RelationField;
    relationshipTypeName: string;
}

/**
 * Representation of the `@cypher` directive and its meta.
 */
export interface CypherField extends BaseField {
    statement: string;
    columnName?: string;
    isEnum: boolean;
    isScalar: boolean;
}

/**
 * Representation of any field thats not
 * a cypher directive or relationship directive
 * String, Int, Float, ID, Boolean... (custom scalars).
 */
export interface PrimitiveField extends BaseField {
    autogenerate?: boolean;
    defaultValue?: any;
    coalesceValue?: any;
    callback?: Callback;
    isGlobalIdField?: boolean;
}

export type CustomScalarField = BaseField;

export interface CustomEnumField extends BaseField {
    // TODO Must be "Enum" - really needs refactoring into classes
    kind: string;
    defaultValue?: string;
    coalesceValue?: string;
}

export interface UnionField extends BaseField {
    nodes?: string[];
}

export interface CustomResolverField extends BaseField {
    requiredFields: string[];
}

export interface InterfaceField extends BaseField {
    implementations?: string[];
}

export type ObjectField = BaseField;

export interface TemporalField extends PrimitiveField {
    timestamps?: TimeStampOperations[];
}

export type PointField = BaseField;

export type SortableField =
    | PrimitiveField
    | CustomScalarField
    | CustomEnumField
    | TemporalField
    | PointField
    | CypherField;

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
export interface GraphQLOptionsArg {
    limit?: number | Integer;
    offset?: number | Integer;
    sort?: GraphQLSortArg[];
}

/**
 * Representation of the where arg
 * passed to resolvers.
 */
export interface GraphQLWhereArg {
    [k: string]: any | GraphQLWhereArg | GraphQLWhereArg[];
    AND?: GraphQLWhereArg[];
    OR?: GraphQLWhereArg[];
    NOT?: GraphQLWhereArg;
}

export interface ConnectionWhereArg {
    node?: GraphQLWhereArg;
    node_NOT?: GraphQLWhereArg;
    edge?: GraphQLWhereArg;
    edge_NOT?: GraphQLWhereArg;
    AND?: ConnectionWhereArg[];
    OR?: ConnectionWhereArg[];
    NOT?: ConnectionWhereArg;
}

export interface InterfaceWhereArg {
    _on?: GraphQLWhereArg[];
    [k: string]: any | GraphQLWhereArg | GraphQLWhereArg[];
}

export type AuthOperations = "CREATE" | "READ" | "UPDATE" | "DELETE" | "CONNECT" | "DISCONNECT" | "SUBSCRIBE";

export type AuthOrders = "pre" | "post";

/**
 * Whats returned when deleting nodes
 */
export interface DeleteInfo {
    nodesDeleted: number;
    relationshipsDeleted: number;
}

export type TimeStampOperations = "CREATE" | "UPDATE";

export type CallbackOperations = "CREATE" | "UPDATE";

export enum CypherRuntime {
    INTERPRETED = "interpreted",
    SLOTTED = "slotted",
    PIPELINED = "pipelined",
}

export enum CypherPlanner {
    COST = "cost",
    IDP = "idp",
    DP = "dp",
}

export enum CypherConnectComponentsPlanner {
    GREEDY = "greedy",
    IDP = "idp",
}

export enum CypherUpdateStrategy {
    DEFAULT = "default",
    EAGER = "eager",
}

export enum CypherExpressionEngine {
    DEFAULT = "default",
    INTERPRETED = "interpreted",
    COMPILED = "compiled",
}

export enum CypherOperatorEngine {
    DEFAULT = "default",
    INTERPRETED = "interpreted",
    COMPILED = "compiled",
}

export enum CypherInterpretedPipesFallback {
    DEFAULT = "default",
    DISABLED = "disabled",
    WHITELISTED_PLANS_ONLY = "whitelisted_plans_only",
    ALL = "all",
}

export enum CypherReplanning {
    DEFAULT = "default",
    FORCE = "force",
    SKIP = "skip",
}

/*
  Object keys and enum values map to values at https://neo4j.com/docs/cypher-manual/current/query-tuning/query-options/#cypher-query-options
*/
export interface CypherQueryOptions {
    runtime?: CypherRuntime;
    planner?: CypherPlanner;
    connectComponentsPlanner?: CypherConnectComponentsPlanner;
    updateStrategy?: CypherUpdateStrategy;
    expressionEngine?: CypherExpressionEngine;
    operatorEngine?: CypherOperatorEngine;
    interpretedPipesFallback?: CypherInterpretedPipesFallback;
    replan?: CypherReplanning;
}

/** The startup validation checks to run */
export interface StartupValidationOptions {
    typeDefs?: boolean;
    resolvers?: boolean;
}

/**
 * Configure which startup validation checks should be run.
 * Optionally, a boolean can be passed to toggle all these options.
 */
export type StartupValidationConfig = StartupValidationOptions | boolean;

/** Input field for graphql-compose */
export type InputField = { type: string; defaultValue?: string; directives?: Directive[] } | string;

export interface Neo4jGraphQLAuthPlugin {
    rolesPath?: string;
    isGlobalAuthenticationEnabled?: boolean;
    bindPredicate?: "all" | "any";

    decode<T>(token: string): Promise<T | undefined>;
    /**
     * This function tries to resolve public or secret keys.
     * The implementation on how to resolve the keys by the `JWKSEndpoint` or by the `Secret` is set on when the plugin is being initiated.
     * @param req
     */
    tryToResolveKeys(req: unknown): void;
}

/** Raw event metadata returned from queries */
export type NodeSubscriptionMeta = {
    event: "create" | "update" | "delete";
    typename: string;
    properties: {
        old: Record<string, any>;
        new: Record<string, any>;
    };
    id: Integer | string | number;
    timestamp: Integer | string | number;
};
export type RelationshipSubscriptionMeta =
    | RelationshipSubscriptionMetaTypenameParameters
    | RelationshipSubscriptionMetaLabelsParameters;
type RelationshipSubscriptionMetaCommonParameters = {
    event: "create_relationship" | "delete_relationship";
    relationshipName: string;
    id_from: Integer | string | number;
    id_to: Integer | string | number;
    properties: {
        from: Record<string, any>;
        to: Record<string, any>;
        relationship: Record<string, any>;
    };
    id: Integer | string | number;
    timestamp: Integer | string | number;
};
export type RelationshipSubscriptionMetaTypenameParameters = RelationshipSubscriptionMetaCommonParameters & {
    fromTypename: string;
    toTypename: string;
};
export type RelationshipSubscriptionMetaLabelsParameters = RelationshipSubscriptionMetaCommonParameters & {
    fromLabels: string[];
    toLabels: string[];
};
export type EventMeta = NodeSubscriptionMeta | RelationshipSubscriptionMeta;

export type NodeSubscriptionsEvent =
    | {
          event: "create";
          typename: string;
          properties: {
              old: undefined;
              new: Record<string, any>;
          };
          id: number;
          timestamp: number;
      }
    | {
          event: "update";
          typename: string;
          properties: {
              old: Record<string, any>;
              new: Record<string, any>;
          };
          id: number;
          timestamp: number;
      }
    | {
          event: "delete";
          typename: string;
          properties: {
              old: Record<string, any>;
              new: undefined;
          };
          id: number;
          timestamp: number;
      };
export type RelationshipSubscriptionsEvent =
    | {
          event: "create_relationship";
          relationshipName: string;
          properties: {
              from: Record<string, any>;
              to: Record<string, any>;
              relationship: Record<string, any>;
          };
          id_from: number;
          id_to: number;
          fromTypename: string;
          toTypename: string;
          id: number;
          timestamp: number;
      }
    | {
          event: "delete_relationship";
          relationshipName: string;
          properties: {
              from: Record<string, any>;
              to: Record<string, any>;
              relationship: Record<string, any>;
          };
          id_from: number;
          id_to: number;
          fromTypename: string;
          toTypename: string;
          id: number;
          timestamp: number;
      };
/** Serialized subscription event */
export type SubscriptionsEvent = NodeSubscriptionsEvent | RelationshipSubscriptionsEvent;

export interface Neo4jGraphQLSubscriptionsPlugin {
    events: EventEmitter;

    publish(eventMeta: SubscriptionsEvent): Promise<void> | void;

    /** To be called, if needed, in getSchema */
    init?(): Promise<void>;
}

export interface Neo4jGraphQLPlugins {
    auth?: Neo4jGraphQLAuthPlugin;
    subscriptions?: Neo4jGraphQLSubscriptionsPlugin;
}

export interface JwtPayload {
    [key: string]: any;
    iss?: string | undefined;
    sub?: string | undefined;
    aud?: string | string[] | undefined;
    exp?: number | undefined;
    nbf?: number | undefined;
    iat?: number | undefined;
    jti?: string | undefined;
}

export type CallbackReturnValue = string | number | boolean | undefined | null;

export type Neo4jGraphQLCallback = (
    parent: Record<string, unknown>,
    args: Record<string, never>,
    context: Record<string, unknown>
) => CallbackReturnValue | Promise<CallbackReturnValue>;

export type Neo4jGraphQLCallbacks = Record<string, Neo4jGraphQLCallback>;

export interface Neo4jStringFiltersSettings {
    GT?: boolean;
    GTE?: boolean;
    LT?: boolean;
    LTE?: boolean;
}

export interface Neo4jFiltersSettings {
    String?: Neo4jStringFiltersSettings;
}

export interface Neo4jFeaturesSettings {
    filters?: Neo4jFiltersSettings;
}

export type PredicateReturn = {
    predicate: Cypher.Predicate | undefined;
    preComputedSubqueries?: Cypher.CompositeClause | undefined;
};

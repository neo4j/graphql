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
import type { DirectiveNode, InputValueDefinitionNode, TypeNode } from "graphql";
import type { Directive } from "graphql-compose";
import type { ResolveTree } from "graphql-parse-resolve-info";
import type { JWTVerifyOptions, RemoteJWKSetOptions } from "jose";
import type { Integer } from "neo4j-driver";
import type { RelationshipNestedOperationsOption, RelationshipQueryDirectionOption } from "../constants";
import type { Neo4jGraphQLSchemaModel } from "../schema-model/Neo4jGraphQLSchemaModel";
import type { DefaultAnnotationValue } from "../schema-model/annotation/DefaultAnnotation";
import type { JwtPayload } from "./jwt-payload";
import type { Neo4jGraphQLContext } from "./neo4j-graphql-context";

export { Node } from "../classes";

export type AuthorizationContext = {
    jwt?: JwtPayload;
    jwtParam: Cypher.Param;
    isAuthenticated: boolean;
    isAuthenticatedParam: Cypher.Param;
    claims?: Map<string, string>;
};

export type FulltextContext = {
    name: string | undefined;
    fields: string[];
    queryType: string;
    queryName: string | undefined;
    indexName: string | undefined; // TODO: not undefined once name is removed.
    scoreVariable: Cypher.Variable;
};

export type FullText = {
    indexes: FulltextContext[];
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

export type Unique = {
    constraintName: string;
};

export interface Callback {
    operations: CallbackOperations[];
    callbackName: string;
}

export type SelectableOptions = {
    onRead: boolean;
    onAggregate: boolean;
};

export type SettableOptions = {
    onCreate: boolean;
    onUpdate: boolean;
};

export type FilterableOptions = {
    byValue: boolean;
    byAggregate: boolean;
};

/**
 * Representation a ObjectTypeDefinitionNode field.
 */
export interface BaseField {
    fieldName: string;
    typeMeta: TypeMeta;
    otherDirectives: DirectiveNode[];
    arguments: InputValueDefinitionNode[];
    private?: boolean;
    description?: string;
    dbPropertyName?: string;
    dbPropertyNameUnescaped?: string;
    unique?: Unique;
    selectableOptions: SelectableOptions;
    settableOptions: SettableOptions;
    filterableOptions: FilterableOptions;
}

/**
 * Representation of the `@relationship` directive and its meta.
 */
export interface RelationField extends BaseField {
    direction: "OUT" | "IN";
    typeUnescaped: string;
    type: string;
    connectionPrefix?: string;
    inherited: boolean;
    properties?: string;
    union?: UnionField;
    interface?: InterfaceField;
    queryDirection: RelationshipQueryDirectionOption;
    nestedOperations: RelationshipNestedOperationsOption[];
    aggregate: boolean;
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
    columnName: string;
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
    defaultValue?: string | string[];
    coalesceValue?: string | string[];
}

export interface UnionField extends BaseField {
    nodes?: string[];
}

export interface CustomResolverField extends BaseField {
    requiredFields: Record<string, ResolveTree>;
}

export interface InterfaceField extends BaseField {
    implementations?: string[];
}

export type ObjectField = BaseField;

export interface TemporalField extends PrimitiveField {
    timestamps?: TimeStampOperations[];
}

export type PointField = BaseField;

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
    [k: string]: any;
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

export type TimeStampOperations = "CREATE" | "UPDATE";

export type CallbackOperations = "CREATE" | "UPDATE";

/*
  Object keys and enum values map to values at https://neo4j.com/docs/cypher-manual/current/query-tuning/query-options/#cypher-query-options
*/
export interface CypherQueryOptions {
    runtime?: "interpreted" | "slotted" | "pipelined";
    planner?: "cost" | "idp" | "dp";
    connectComponentsPlanner?: "greedy" | "idp";
    updateStrategy?: "default" | "eager";
    expressionEngine?: "default" | "interpreted" | "compiled";
    operatorEngine?: "default" | "interpreted" | "compiled";
    interpretedPipesFallback?: "default" | "disabled" | "whitelisted_plans_only" | "all";
    replan?: "default" | "force" | "skip";
}

/** Input field for graphql-compose */
export type InputField = { type: string; defaultValue?: DefaultAnnotationValue; directives?: Directive[] } | string;

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
export type RelationshipSubscriptionsEvent =
    | {
          event: "create_relationship";
          relationshipName: string;
          properties: {
              from: Record<string, any>;
              to: Record<string, any>;
              relationship: Record<string, any>;
          };
          id_from: string;
          id_to: string;
          fromTypename: string;
          toTypename: string;
          id: string;
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
          id_from: string;
          id_to: string;
          fromTypename: string;
          toTypename: string;
          id: string;
          timestamp: number;
      };
/** Serialized subscription event */
export type SubscriptionsEvent = NodeSubscriptionsEvent | RelationshipSubscriptionsEvent;

export type SubscriptionEngineContext = {
    schemaModel: Neo4jGraphQLSchemaModel;
};

/** Defines a custom mechanism to transport subscription events internally between servers */
export interface Neo4jGraphQLSubscriptionsEngine {
    events: EventEmitter;

    publish(eventMeta: SubscriptionsEvent): Promise<void> | void;

    /** To be called, if needed, in getSchema */
    init?(context: SubscriptionEngineContext): Promise<void>;

    /** Stops subscription */
    close(): void;
}

export type CallbackReturnValue = string | number | boolean | undefined | null;

export type Neo4jGraphQLCallback = (
    parent: Record<string, unknown>,
    args: Record<string, never>,
    context: Neo4jGraphQLContext
) => CallbackReturnValue | Promise<CallbackReturnValue>;

export type Neo4jGraphQLCallbacks = Record<string, Neo4jGraphQLCallback>;

export interface Neo4jStringFiltersSettings {
    GT?: boolean;
    GTE?: boolean;
    LT?: boolean;
    LTE?: boolean;
    MATCHES?: boolean;
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
    subscriptions?: Neo4jGraphQLSubscriptionsEngine | boolean;
};

/** Parsed features used in context */
export type ContextFeatures = {
    filters?: Neo4jFiltersSettings;
    populatedBy?: Neo4jPopulatedBySettings;
    authorization?: Neo4jAuthorizationSettings;
    subscriptions?: Neo4jGraphQLSubscriptionsEngine;
};

export type PredicateReturn = {
    predicate: Cypher.Predicate | undefined;
    preComputedSubqueries?: Cypher.CompositeClause | undefined;
};

export type CypherFieldReferenceMap = Record<string, Cypher.Node | Cypher.Variable>;

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

import { InputValueDefinitionNode, DirectiveNode } from "graphql";
import { ResolveTree } from "graphql-parse-resolve-info";
import { JwtPayload } from "jsonwebtoken";
import { Driver, Integer } from "neo4j-driver";
import { Neo4jGraphQL } from "./classes";

export type DriverConfig = {
    database?: string;
    bookmarks?: string | string[];
};

interface AuthContext {
    isAuthenticated: boolean;
    roles: [string];
    jwt: JwtPayload;
}

export interface Context {
    driver: Driver;
    driverConfig?: DriverConfig;
    resolveTree: ResolveTree;
    neoSchema: Neo4jGraphQL;
    jwt?: JwtPayload;
    auth?: AuthContext;
    queryOptions?: CypherQueryOptions;
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

export type Auth = {
    rules: AuthRule[];
    type: "JWT";
};

export type FullTextIndex = {
    name: string;
    fields: string[];
    defaultThreshold?: number;
};

export type FullText = {
    indexes: FullTextIndex[];
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
}

export type RelationshipDirection = "IN" | "OUT";

export interface RelationshipMeta {
    /**
     * Value passed into the `direction` argument of `@relationship` directive
     */
    direction: RelationshipDirection;
    /**
     * A more suitable form of `type` appropriate for translation where non-word
     * characters are replaced with an underscore and converted to lowercase
     * @example
     * [:DIRECTED|ACTED_IN] -> directed_acted_in
     */
    paramName: string;
    /**
     * Value passed into the `properties` argument of `@relationship` directive
     */
    properties?: string;
    /**
     * Whether relationship type represents multiple relationship types. Derived from `types`
     * @example
     * [:DIRECTED] = false
     * [:DIRECTED|ACTED_IN] = true
     */
    multiple: boolean;
    /**
     * Value passed into the `type` argument of `@relationship` directive
     */
    type: string;
    /**
     * An array of relationship types taken from `type`
     * @example
     * [:DIRECTED] = [DIRECTED]
     * [:DIRECTED|ACTED_IN] = [DIRECTED, ACTED_IN]
     */
    types: string[];
}

export interface Unique {
    constraintName: string;
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
    ignored?: boolean;
    dbPropertyName?: string;
    unique?: Unique;
}

/**
 * Representation of the `@relationship` directive and its meta.
 */
export interface RelationField extends BaseField, RelationshipMeta {
    connectionPrefix?: string;
    inherited: boolean;
    union?: UnionField;
    interface?: InterfaceField;
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
}

export type CustomScalarField = BaseField;

export interface CustomEnumField extends BaseField {
    // TODO Must be "Enum" - really needs refactoring into classes
    kind: string;
}

export interface UnionField extends BaseField {
    nodes?: string[];
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
}

export interface ConnectionWhereArg {
    node?: GraphQLWhereArg;
    node_NOT?: GraphQLWhereArg;
    edge?: GraphQLWhereArg;
    edge_NOT?: GraphQLWhereArg;
    AND?: ConnectionWhereArg[];
    OR?: ConnectionWhereArg[];
}

export interface InterfaceWhereArg {
    _on?: GraphQLWhereArg[];
    [k: string]: any | GraphQLWhereArg | GraphQLWhereArg[];
}

export type AuthOperations = "CREATE" | "READ" | "UPDATE" | "DELETE" | "CONNECT" | "DISCONNECT";

export type AuthOrders = "pre" | "post";

/**
 * Whats returned when deleting nodes
 */
export interface DeleteInfo {
    nodesDeleted: number;
    relationshipsDeleted: number;
}

export type TimeStampOperations = "CREATE" | "UPDATE";

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

/** Nested Records helper type, supports any level of recursion. Ending in properties of type T */
export interface NestedRecord<T> extends Record<string | symbol | number, T | NestedRecord<T>> {} // Using interface to allow recursive types

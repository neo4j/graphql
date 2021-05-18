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
import { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "./classes";

export type DriverConfig = {
    database?: string;
    bookmarks?: string | string[];
};

export interface Context {
    driver: Driver;
    driverConfig?: DriverConfig;
    resolveTree: ResolveTree;
    neoSchema: Neo4jGraphQL;
    jwt?: any;
    [k: string]: any;
}

export interface BaseAuthRule {
    isAuthenticated?: boolean;
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
}

/**
 * Representation of the `@relationship` directive and its meta.
 */
export interface RelationField extends BaseField {
    direction: "OUT" | "IN";
    type: string;
    properties?: string;
    union?: UnionField;
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

export type CustomEnumField = BaseField;

export interface UnionField extends BaseField {
    nodes?: string[];
}

export type InterfaceField = BaseField;

export type ObjectField = BaseField;

export interface DateTimeField extends PrimitiveField {
    timestamps?: TimeStampOperations[];
}

export type PointField = BaseField;

export type SortDirection = "ASC" | "DESC";

export interface GraphQLSortArg {
    [field: string]: SortDirection;
}

export interface ConnectionSortArg {
    node?: GraphQLSortArg;
    relationship?: GraphQLSortArg;
}

/**
 * Representation of the options arg
 * passed to resolvers.
 */
export interface GraphQLOptionsArg {
    limit?: number;
    skip?: number;
    sort?: GraphQLSortArg[];
}

export interface ConnectionOptionsArg {
    sort?: ConnectionSortArg[];
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
    relationship?: GraphQLWhereArg;
    relationship_NOT?: GraphQLWhereArg;
    AND?: ConnectionWhereArg[];
    OR?: ConnectionWhereArg[];
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

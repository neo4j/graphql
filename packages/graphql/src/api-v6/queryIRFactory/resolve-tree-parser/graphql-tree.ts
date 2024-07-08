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

import type { Integer } from "neo4j-driver";

export type GraphQLTree = GraphQLTreeReadOperation;

interface GraphQLTreeElement {
    alias: string;
    args: Record<string, any>;
}

type LogicalOperation<T> = {
    AND?: Array<LogicalOperation<T>>;
    OR?: Array<LogicalOperation<T>>;
    NOT?: LogicalOperation<T>;
} & T;

export type StringFilters = LogicalOperation<{
    equals?: string;
    in?: string[];
    matches?: string;
    contains?: string;
    startsWith?: string;
    endsWith?: string;
}>;

export type NumberFilters = LogicalOperation<{
    equals?: string;
    in?: string[];
    lt?: string;
    lte?: string;
    gt?: string;
    gte?: string;
}>;

export type RelationshipFilters = {
    edges?: {
        some?: GraphQLEdgeWhereArgs;
        single?: GraphQLEdgeWhereArgs;
        all?: GraphQLEdgeWhereArgs;
        none?: GraphQLEdgeWhereArgs;
    };
};

export interface GraphQLTreeReadOperation extends GraphQLTreeElement {
    fields: {
        connection?: GraphQLTreeConnection;
    };
    args: GraphQLReadOperationArgs;
    name: string;
}

export interface GraphQLReadOperationArgs {
    where?: GraphQLWhereArgs;
}

export type GraphQLWhereArgs = LogicalOperation<{
    edges?: GraphQLEdgeWhereArgs;
}>;

export type GraphQLNodeWhereArgs = LogicalOperation<Record<string, GraphQLNodeFilters | null>>;

export type GraphQLEdgeWhereArgs = LogicalOperation<{
    properties?: Record<string, GraphQLAttributeFilters | null>;
    node?: GraphQLNodeWhereArgs;
}>;

export type GraphQLAttributeFilters = StringFilters | NumberFilters;
export type GraphQLNodeFilters = GraphQLAttributeFilters | RelationshipFilters;

export interface GraphQLTreeConnection extends GraphQLTreeElement {
    fields: {
        edges?: GraphQLTreeEdge;
    };
    args: GraphQLConnectionArgs;
}

export interface GraphQLConnectionArgs {
    sort?: GraphQLSortArgument;
    first?: Integer;
    after?: string;
}

export interface GraphQLTreeEdge extends GraphQLTreeElement {
    fields: {
        node?: GraphQLTreeNode;
        properties?: GraphQLTreeEdgeProperties;
    };
}

export interface GraphQLTreeNode extends GraphQLTreeElement {
    fields: Record<string, GraphQLTreeLeafField | GraphQLTreeReadOperation>;
}

export interface GraphQLTreeEdgeProperties extends GraphQLTreeElement {
    fields: Record<string, GraphQLTreeLeafField>;
}

export type GraphQLTreeLeafField = GraphQLTreeScalarField | GraphQLTreePoint | GraphQLTreeCartesianPoint;
export interface GraphQLTreeScalarField extends GraphQLTreeElement {
    fields: undefined;
    name: string;
}
export interface GraphQLTreePoint extends GraphQLTreeElement {
    fields: {
        longitude: GraphQLTreeScalarField | undefined;
        latitude: GraphQLTreeScalarField | undefined;
        height: GraphQLTreeScalarField | undefined;
        crs: GraphQLTreeScalarField | undefined;
        srid: GraphQLTreeScalarField | undefined;
    };
    name: string;
}

export interface GraphQLTreeCartesianPoint extends GraphQLTreeElement {
    fields: {
        x: GraphQLTreeScalarField | undefined;
        y: GraphQLTreeScalarField | undefined;
        z: GraphQLTreeScalarField | undefined;
        crs: GraphQLTreeScalarField | undefined;
        srid: GraphQLTreeScalarField | undefined;
    };
    name: string;
}

export interface GraphQLSortArgument {
    edges: GraphQLSortEdgeArgument[];
}

export interface GraphQLSortEdgeArgument {
    node?: GraphQLTreeSortElement;
    properties?: GraphQLTreeSortElement;
}

export interface GraphQLTreeSortElement {
    [key: string]: "ASC" | "DESC";
}

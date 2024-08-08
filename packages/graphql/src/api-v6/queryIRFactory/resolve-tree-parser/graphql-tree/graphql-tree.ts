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
import type { GraphQLTreeLeafField } from "./attributes";
import type { GraphQLSort, GraphQLSortEdge } from "./sort";
import type { GraphQLTreeElement } from "./tree-element";
import type { GraphQLWhere, GraphQLWhereTopLevel } from "./where";

// TODO GraphQLTreeCreateInput should be a union of PrimitiveTypes and relationship fields
export type GraphQLTreeCreateInput = Record<string, unknown>;
export type GraphQLTreeUpdateInput = Record<string, GraphQLTreeUpdateField>;

export type UpdateOperation = "set";
export type GraphQLTreeUpdateField = Record<UpdateOperation, any>;

export interface GraphQLTreeCreate extends GraphQLTreeNode {
    name: string;
    args: {
        input: GraphQLTreeCreateInput[];
    };
}

export interface GraphQLTreeUpdate extends GraphQLTreeNode {
    name: string;
    args: {
        where: GraphQLWhereTopLevel;
        input: GraphQLTreeUpdateInput[];
    };
}

export interface GraphQLTree extends GraphQLTreeElement {
    name: string;
    fields: {
        connection?: GraphQLTreeConnectionTopLevel;
    };
    args: {
        where?: GraphQLWhereTopLevel;
    };
}

export interface GraphQLTreeReadOperation extends GraphQLTreeElement {
    name: string;
    fields: {
        connection?: GraphQLTreeConnection;
    };
    args: {
        where?: GraphQLWhere;
    };
}

export interface GraphQLTreeConnection extends GraphQLTreeElement {
    fields: {
        edges?: GraphQLTreeEdge;
    };
    args: {
        sort?: GraphQLSort[];
        first?: Integer;
        after?: string;
    };
}

export interface GraphQLTreeConnectionTopLevel extends GraphQLTreeElement {
    fields: {
        edges?: GraphQLTreeEdge;
    };
    args: {
        sort?: GraphQLSortEdge[];
        first?: Integer;
        after?: string;
    };
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

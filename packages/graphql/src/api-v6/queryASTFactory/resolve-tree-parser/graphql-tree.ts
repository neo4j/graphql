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

export type GraphQLTree = GraphQLTreeReadOperation;

interface GraphQLTreeElement {
    alias: string;
    args: Record<string, any>;
}

export interface GraphQLTreeReadOperation extends GraphQLTreeElement {
    fields: {
        connection?: GraphQLTreeConnection;
    };
}

export interface GraphQLTreeConnection extends GraphQLTreeElement {
    fields: {
        edges?: GraphQLTreeEdge;
    };
    args: GraphQLConnectionArgs;
}

export interface GraphQLConnectionArgs {
    sort?: GraphQLSortArgument[];
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

export interface GraphQLTreeLeafField extends GraphQLTreeElement {
    fields: undefined;
}

export interface GraphQLSortArgument {
    edges: {
        node: Record<string, "ASC" | "DESC">;
    };
}

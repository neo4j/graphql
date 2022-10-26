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

import type { TreeDescriptor } from "../types";
import type { RelationField } from "../../../types";
import type { Node, Relationship } from "../../../classes";

export interface IAST {
    childrens: IAST[];
    addChildren: (children: IAST) => void;
    accept: <R>(visitor: Visitor) => void;
}

export interface IConnectAST extends IAST {
    node: Node;
    parent: Node;
    edgeProperties: string[];
    where: TreeDescriptor;
    connect: TreeDescriptor;
    relationshipPropertyPath: string;
    relationship: [RelationField | undefined, Node[]];
}

export interface IConnectOrCreateAST extends IAST {
    parent: Node;
    where: TreeDescriptor;
    onCreate: TreeDescriptor;
}

export interface ICreateAST extends IAST {
    nodeProperties: string[];
    node: Node;
}

export interface INestedCreateAST extends IAST {
    node: Node;
    parent: Node;
    nodeProperties: string[];
    edgeProperties: string[];
    relationshipPropertyPath: string;
    relationship: [RelationField | undefined, Node[]];
    edge: Relationship | undefined;
}

export interface Visitor {
    visitCreate: (create: ICreateAST) => void;
    visitNestedCreate: (nestedCreate: INestedCreateAST) => void;
    // visitConnect: (connect: IConnectAST) => void;
    // visitConnectOrCreate: (connectOrCreate: IConnectOrCreateAST) => void;
}

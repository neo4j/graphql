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

/* 
import type { TreeDescriptor } from "../types";
import type { RelationField } from "../../../types";
import type { Visitor, IConnectAST } from "./types";
import type { Node } from "../../../classes";
import { AST } from "./AST";

export class ConnectAST extends AST implements IConnectAST {
    node: Node;
    parent: Node;
    edgeProperties: string[];
    where: TreeDescriptor;
    connect: TreeDescriptor;
    relationshipPropertyPath: string;
    relationship: [RelationField | undefined, Node[]];

    constructor(
        node: Node,
        parent: Node,
        edgeProperties: string[],
        where: TreeDescriptor,
        connect: TreeDescriptor,
        relationshipPropertyPath: string,
        relationship: [RelationField | undefined, Node[]]
    ) {
        super();
        this.node = node;
        this.parent = parent;
        this.edgeProperties = edgeProperties;
        this.where = where;
        this.connect = connect;
        this.relationshipPropertyPath = relationshipPropertyPath;
        this.relationship = relationship;
    }

    accept<R>(visitor: Visitor<R>): R {
         return visitor.visitConnect(this);
    }
} */

export class ConnectAST {}

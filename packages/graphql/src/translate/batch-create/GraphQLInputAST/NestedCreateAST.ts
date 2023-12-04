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

import type { Visitor } from "./types";
import { UnwindASTNode } from "./UnwindASTNode";
import type { Node, Relationship } from "../../../classes";
import type { RelationField } from "../../../types";
export class NestedCreateAST extends UnwindASTNode {
    node: Node;
    parent: Node;
    nodeProperties: string[];
    edgeProperties: string[];
    relationshipPropertyPath: string;
    relationship: [RelationField | undefined, Node[]];
    edge: Relationship | undefined;

    constructor(
        id: number,
        node: Node,
        parent: Node,
        nodeProperties: string[],
        edgeProperties: string[],
        relationshipPropertyPath: string,
        relationship: [RelationField | undefined, Node[]],
        edge?: Relationship
    ) {
        super(id);
        this.node = node;
        this.parent = parent;
        this.nodeProperties = nodeProperties;
        this.edgeProperties = edgeProperties;
        this.relationshipPropertyPath = relationshipPropertyPath;
        this.relationship = relationship;
        this.edge = edge;
    }

    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitNestedCreate(this);
    }
}

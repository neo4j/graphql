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

import type { RelationField } from "../../../types";
import type { Visitor, INestedCreateAST } from "./types";
import type { Node, Relationship } from "../../../classes";
import { AST } from "./AST";

export class NestedCreateAST extends AST implements INestedCreateAST {
    node: Node;
    parent: Node;
    nodeProperties: string[];
    edgeProperties: string[];
    relationshipPropertyPath: string;
    relationship: [RelationField | undefined, Node[]];
    edge: Relationship | undefined;

    constructor(
        node: Node,
        parent: Node,
        nodeProperties: string[],
        edgeProperties: string[],
        relationshipPropertyPath: string,
        relationship: [RelationField | undefined, Node[]],
        edge?: Relationship
    ) {
        super();
        this.node = node;
        this.parent = parent;
        this.nodeProperties = nodeProperties;
        this.edgeProperties = edgeProperties;
        this.relationshipPropertyPath = relationshipPropertyPath;
        this.relationship = relationship;
        this.edge = edge;
    }

    accept(visitor: Visitor): void {
        visitor.visitNestedCreate(this);
    }
}

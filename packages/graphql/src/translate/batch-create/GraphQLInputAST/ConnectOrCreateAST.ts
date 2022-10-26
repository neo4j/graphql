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
import type { Visitor, IConnectOrCreateAST } from "./types";
import type { Node } from "../../../classes";
import { AST } from "./AST";

/* export class ConnectOrCreateAST extends AST implements IConnectOrCreateAST {
    parent: Node;
    where: TreeDescriptor;
    onCreate: TreeDescriptor;

    constructor(parent: Node, where: TreeDescriptor, onCreate: TreeDescriptor) {
        super();
        this.parent = parent;
        this.where = where;
        this.onCreate = onCreate;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitConnectOrCreate(this);
    }
} */

export class ConnectOrCreateAST {}
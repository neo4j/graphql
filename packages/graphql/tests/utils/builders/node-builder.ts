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

import type { NodeConstructor } from "../../../src/classes";
import { Node } from "../../../src/classes";
import type { NodeDirectiveConstructor } from "../../../src/classes/NodeDirective";
import { NodeDirective } from "../../../src/classes/NodeDirective";
import { Builder } from "./builder";

export class NodeBuilder extends Builder<Node, NodeConstructor> {
    constructor(newOptions: Partial<NodeConstructor> = {}) {
        super({
            name: "",
            relationFields: [],
            connectionFields: [],
            cypherFields: [],
            primitiveFields: [],
            scalarFields: [],
            enumFields: [],
            otherDirectives: [],
            propagatedDirectives: [],
            unionFields: [],
            interfaceFields: [],
            interfaces: [],
            objectFields: [],
            temporalFields: [],
            pointFields: [],
            customResolverFields: [],
            ...newOptions,
        });
    }

    public with(newOptions: Partial<NodeConstructor>): NodeBuilder {
        this.options = { ...this.options, ...newOptions };
        return this;
    }

    public withNodeDirective(directiveOptions: NodeDirectiveConstructor): NodeBuilder {
        const nodeDirective = new NodeDirective(directiveOptions);
        return this.with({ nodeDirective });
    }

    public instance(): Node {
        return new Node(this.options);
    }
}

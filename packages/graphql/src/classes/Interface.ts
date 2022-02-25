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

import { GraphElement, GraphElementConstructor } from './GraphElement';
import Node from './Node';
import type { Context } from '../types';

export interface InterfaceConstructor extends GraphElementConstructor {
    implementations: Node[];
}

class Interface extends GraphElement {
    public implementations: Node[];

    constructor(input: InterfaceConstructor) {
        super(input);
        this.implementations = input.implementations;
    }

    getLabelStrings(context: Context) : string[] {
        //return [':' + this.name];
        return this.implementations.map(impl => impl.getLabelString(context));
    }
}

export default Interface;

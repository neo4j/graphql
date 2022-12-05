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

import { NamedReference, Reference } from "./Reference";

/** Represents a variable
 * @group Internal
 */
export class Variable extends Reference {
    constructor() {
        super("var");
    }
}

/** For compatibility reasons, represents a plain string variable
 * @hidden
 */
export class NamedVariable extends Variable implements NamedReference {
    public readonly id: string;

    constructor(name: string) {
        super();
        this.id = name;
        this.prefix = "";
    }
}

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

import type { ValueNode } from "graphql";
import type { AttributeType } from "../attribute/AttributeType";
import { parseValueNode } from "../parser/parse-value-node";

export class Argument {
    public readonly name: string;
    public readonly type: AttributeType;
    public readonly defaultValue?: string;
    public readonly description?: string;
    // Arguments can have annotations but we don't seem to use this feature
    // public readonly annotations: Partial<Annotations> = {};

    constructor({
        name,
        type,
        defaultValue,
        description,
    }: {
        name: string;
        type: AttributeType;
        defaultValue?: ValueNode;
        description?: string;
    }) {
        this.name = name;
        this.type = type;
        this.defaultValue = defaultValue ? parseValueNode(defaultValue) : undefined;
        this.description = description;
    }
}

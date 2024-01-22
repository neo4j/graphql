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

import { type Annotations } from "../annotation/Annotation";
import type { Argument } from "../argument/Argument";
import type { AttributeType } from "./AttributeType";

export class Attribute {
    public readonly name: string;
    public readonly annotations: Partial<Annotations>;
    public readonly type: AttributeType;
    public readonly databaseName: string;
    public readonly description?: string;
    public readonly args: Argument[];

    constructor({
        name,
        annotations = {},
        type,
        args,
        databaseName,
        description,
    }: {
        name: string;
        annotations?: Partial<Annotations>;
        type: AttributeType;
        args: Argument[];
        databaseName?: string;
        description?: string;
    }) {
        this.name = name;
        this.annotations = annotations;
        this.type = type;
        this.args = args;
        this.databaseName = databaseName ?? name;
        this.description = description;
    }

    public clone(): Attribute {
        return new Attribute({
            name: this.name,
            annotations: this.annotations,
            type: this.type,
            args: this.args,
            databaseName: this.databaseName,
            description: this.description,
        });
    }
}

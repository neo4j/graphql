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

import type { Annotation } from "./Annotation";

export class KeyAnnotation implements Annotation {
    readonly name = "key";
    // fields from the @key directive is intentionally excluded as it is not in use by our schema model
    public resolvable: boolean; // Defaults to true
    public _fields: Set<string>;

    constructor({ resolvable = true, fields }: { resolvable?: boolean; fields: string[] }) {
        this.resolvable = resolvable;
        this._fields = new Set(fields);
    }

    public get fields(): string {
        return Array.from(this._fields).join(" ");
    }
}

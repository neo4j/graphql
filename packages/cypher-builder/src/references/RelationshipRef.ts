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

import type { NodeRef } from "./NodeRef";
import { Reference } from "./Reference";
import type { Param } from "./Param";

export type RelationshipInput = {
    source: NodeRef;
    target: NodeRef;
    type?: string;
};

export type RelationshipProperties = Record<string, Param<any>>;

/** Reference to a relationship property
 * @group References
 */
export class RelationshipRef extends Reference {
    private _type: string | undefined;
    public properties: RelationshipProperties;

    constructor(input: { type?: string; properties?: RelationshipProperties } = {}) {
        super("this");
        this._type = input.type || undefined;
        this.properties = input.properties || {};
    }

    public get type(): string | undefined {
        return this._type;
    }
}

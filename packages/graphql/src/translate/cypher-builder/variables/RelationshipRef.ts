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

import { Variable } from "./Variable";
import type { NodeRef } from "./NodeRef";
import { MatchPatternOptions, Pattern } from "../Pattern";

export type RelationshipInput = {
    source: NodeRef;
    target: NodeRef;
    type?: string;
    directed?: boolean;
};

export class RelationshipRef extends Variable {
    private _source: NodeRef;
    private _target: NodeRef;

    public readonly type?: string;
    public readonly directed: boolean;

    constructor(input: RelationshipInput) {
        super("this");
        this.type = input.type || undefined;
        this._source = input.source;
        this._target = input.target;
        this.directed = input.directed === undefined ? true : input.directed;
    }

    public get source(): NodeRef {
        return this._source;
    }

    public get target(): NodeRef {
        return this._target;
    }

    /** Reverses the direction of the relationship */
    public reverse(): void {
        const oldTarget = this._target;
        this._target = this._source;
        this._source = oldTarget;
    }

    /** Creates a new Pattern from this relationship */
    public pattern(options: MatchPatternOptions = {}): Pattern<RelationshipRef> {
        return new Pattern(this, options);
    }

    public getTypeString(): string {
        return this.type ? `:${this.type}` : "";
    }
}

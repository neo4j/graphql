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
import { MatchPatternOptions, Pattern } from "../Pattern";
import { Reference } from "./Reference";

export type RelationshipInput = {
    source: NodeRef;
    target: NodeRef;
    type?: string;
};

export class RelationshipRef extends Reference {
    private _source: NodeRef;
    private _target: NodeRef;
    private _type: string | undefined;

    constructor(input: RelationshipInput) {
        super("this");
        this._type = input.type || undefined;
        this._source = input.source;
        this._target = input.target;
    }

    public get source(): NodeRef {
        return this._source;
    }

    public get target(): NodeRef {
        return this._target;
    }

    public get type(): string | undefined {
        return this._type;
    }

    /** Sets the type of the relationship */
    public withType(type: string): this {
        this._type = type;
        return this;
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
}

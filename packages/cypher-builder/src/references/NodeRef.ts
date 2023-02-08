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

import { HasLabel } from "../expressions/HasLabel";
import type { PartialPattern } from "../pattern/PartialPattern";
import { Pattern } from "../pattern/Pattern";
import type { Param } from "./Param";
import { NamedReference, Reference } from "./Reference";
import { RelationshipRef } from "./RelationshipRef";

export type NodeProperties = Record<string, Param<any>>;

type NodeRefOptions = {
    labels?: string[];
    properties?: NodeProperties;
};

/** Represents a node reference
 * @group References
 */
export class NodeRef extends Reference {
    public labels: string[];
    public properties: NodeProperties;

    constructor(options: NodeRefOptions = {}) {
        super("this");
        this.labels = options.labels || [];
        this.properties = options.properties || {};
    }

    public related(relationship?: RelationshipRef): PartialPattern {
        if (!relationship) relationship = new RelationshipRef();
        return this.pattern().related(relationship);
    }

    public hasLabels(...labels: string[]): HasLabel {
        return new HasLabel(this, labels);
    }

    public hasLabel(label: string): HasLabel {
        return new HasLabel(this, [label]);
    }

    /** Creates a new Pattern from this node */
    public pattern(): Pattern {
        return new Pattern(this);
    }
}

/** Represents a node reference with a given name
 * @group References
 */
export class NamedNode extends NodeRef implements NamedReference {
    public readonly id: string;

    constructor(id: string, options?: NodeRefOptions) {
        super(options || {});
        this.id = id;
    }

    public get name(): string {
        return this.id;
    }
}

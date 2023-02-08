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

import type { CypherEnvironment } from "../Environment";
import type { NodeRef } from "../references/NodeRef";
import { RelationshipRef } from "../references/RelationshipRef";
import { escapeLabel } from "../utils/escape-label";
import { PartialPattern } from "./PartialPattern";
import { PatternElement } from "./PatternElement";

export class Pattern extends PatternElement<NodeRef> {
    private withLabels = true;
    private withProperties = true;
    private withVariable = true;
    private previous: PartialPattern | undefined;

    constructor(node: NodeRef, previous?: PartialPattern) {
        super(node);
        this.previous = previous;
    }

    public withoutLabels(): this {
        this.withLabels = false;
        return this;
    }

    public withoutVariable(): this {
        this.withVariable = false;
        return this;
    }

    public withoutProperties(): this {
        this.withProperties = false;
        return this;
    }

    public related(rel?: RelationshipRef): PartialPattern {
        if (!rel) rel = new RelationshipRef();
        return new PartialPattern(rel, this);
    }

    public getCypher(env: CypherEnvironment): string {
        const prevStr = this.previous?.getCypher(env) || "";

        const nodeRefId = this.withVariable ? `${this.element.getCypher(env)}` : "";

        const propertiesStr = this.withProperties ? this.serializeParameters(this.element.properties || {}, env) : "";
        const nodeLabelStr = this.withLabels ? this.getNodeLabelsString(this.element) : "";

        return `${prevStr}(${nodeRefId}${nodeLabelStr}${propertiesStr})`;
    }

    private getNodeLabelsString(node: NodeRef): string {
        const escapedLabels = node.labels.map(escapeLabel);
        if (escapedLabels.length === 0) return "";
        return `:${escapedLabels.join(":")}`;
    }
}

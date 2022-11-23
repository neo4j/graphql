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

import { CypherASTNode } from "../CypherASTNode";
import type { CypherEnvironment } from "../Environment";
import { escapeLabel } from "../utils/escape-label";
import type { NodeRef } from "../references/NodeRef";

export class HasLabel extends CypherASTNode {
    private node: NodeRef;
    private expectedLabels: string[];

    constructor(node: NodeRef, expectedLabels: string[]) {
        super();
        if (expectedLabels.length === 0) throw new Error("HasLabel needs at least 1 label");
        this.node = node;
        this.expectedLabels = expectedLabels;
    }

    public getCypher(env: CypherEnvironment): string {
        const nodeId = this.node.getCypher(env);
        const labelsStr = this.expectedLabels
            .map((label) => {
                return `:${escapeLabel(label)}`;
            })
            .join("");
        return `${nodeId}${labelsStr}`;
    }
}

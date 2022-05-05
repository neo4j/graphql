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

import { escapeLabel } from "../utils";
import { CypherVariable } from "./References";

type NodeInput = {
    labels?: Array<string>;
};

export class Node implements CypherVariable {
    public readonly prefix = "this";
    public readonly labels: Array<string>;

    constructor(input: NodeInput) {
        this.labels = input.labels || [];
    }

    public getLabelsString(): string {
        const escapedLabels = this.labels.map(escapeLabel);
        if (escapedLabels.length === 0) return "";
        return `:${escapedLabels.join(":")}`;
    }
}

export class NamedNode extends Node {
    public readonly id: string;

    constructor(id: string, input?: NodeInput) {
        super(input || {});
        this.id = id;
    }
}

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

import { Directive } from "../../types";

export class NodeDirective implements Directive {
    label?: string;
    additionalLabels: string[] = [];

    addLabel(label: string) {
        this.label = label;
    }

    addAdditionalLabels(labels: string[] | string) {
        if (!labels.length) {
            return;
        }
        this.additionalLabels = this.additionalLabels.concat(labels);
    }

    toString() {
        const directiveArguments: string[] = [];
        if (this.label) {
            directiveArguments.push(`label: "${this.label}"`);
        }
        if (this.additionalLabels.length) {
            directiveArguments.push(`additonalLabels: ["${this.additionalLabels.join('","')}"]`);
        }
        return directiveArguments.length ? `@node(${directiveArguments.join(", ")})` : "";
    }
}

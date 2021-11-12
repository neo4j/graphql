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

import { Directive, ExcludeOperation } from "../types";

export class ExcludeDirective implements Directive {
    operations: ExcludeOperation[] = [];
    addOperation(operation: ExcludeOperation) {
        if (!this.operations.includes(operation)) {
            this.operations.push(operation);
        }
    }

    removeOperation(operation: ExcludeOperation) {
        this.operations = this.operations.filter((o) => o !== operation);
    }

    toString() {
        const parts: string[] = [];
        if (this.operations.length) {
            parts.push("(");
            parts.push("operations");
            parts.push("[");
            parts.push(this.operations.join(", "));
            parts.push("]");
            parts.push(")");
        }

        return `@exclude${parts.join("")}`;
    }
}

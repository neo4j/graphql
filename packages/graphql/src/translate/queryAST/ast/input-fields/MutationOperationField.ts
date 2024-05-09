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

import type Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../QueryASTContext";
import type { MutationOperation } from "../operations/operations";
import { InputField } from "./InputField";

export class MutationOperationField extends InputField {
    public mutationOperation: MutationOperation;

    constructor(name: string, mutationOperation: MutationOperation) {
        super(name);
        this.mutationOperation = mutationOperation;
    }

    public getChildren() {
        return [this.mutationOperation];
    }

    public print(): string {
        return `${super.print()} <${this.name}>`;
    }

    public getSetParams(): Cypher.SetParam[] {
        return [];
    }

    public getSubqueries(queryASTContext: QueryASTContext): Cypher.Clause[] {
        const { clauses } = this.mutationOperation.transpile(queryASTContext);
        return clauses;
    }
}

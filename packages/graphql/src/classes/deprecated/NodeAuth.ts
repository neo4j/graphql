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

import { asArray, haveSharedElement } from "../../utils/utils";
import type { AuthOperations } from "../../types/deprecated/auth/auth-operations";
import type { AuthRule } from "../../types/deprecated/auth/auth-rule";
import type { Auth } from "../../types/deprecated/auth/auth";

/** Helper class for a node auth directive */
export class NodeAuth implements Auth {
    public readonly rules: AuthRule[];
    public readonly type: "JWT";

    constructor({ rules, type }: Auth) {
        this.rules = rules;
        this.type = type;
    }

    public getRules(operations: AuthOperations[] | AuthOperations | undefined): AuthRule[] {
        if (operations) {
            const operationsList = asArray(operations);
            return this.rules.filter((r) => this.operationsMatchRule(operationsList, r));
        }
        return this.rules;
    }

    private operationsMatchRule(operations: AuthOperations[], rule: AuthRule): boolean {
        return !rule.operations || haveSharedElement(operations, rule.operations || []);
    }
}

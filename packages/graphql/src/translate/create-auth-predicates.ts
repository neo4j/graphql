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

import Cypher from "@neo4j/cypher-builder";
import { NodeAuth } from "../classes/deprecated/NodeAuth";
import type { BaseField, Context, Node } from "../types";
import type { AuthOperations } from "../types/deprecated/auth/auth-operations";
import type { AuthRule } from "../types/deprecated/auth/auth-rule";
import type { BaseAuthRule } from "../types/deprecated/auth/base-auth-rule";
import { createSubPredicate } from "./deprecated/auth/create-sub-predicate";
import type { Rule } from "./deprecated/auth/types";

export function createAuthPredicates({
    entity,
    operations,
    skipRoles,
    skipIsAuthenticated,
    allow,
    context,
    bind,
    where,
}: {
    entity: Node | BaseField;
    operations?: AuthOperations | AuthOperations[];
    skipRoles?: boolean;
    skipIsAuthenticated?: boolean;
    allow?: Rule;
    context: Context;
    bind?: Rule;
    where?: Rule;
}): Cypher.Predicate | undefined {
    if (!entity.auth) {
        return undefined;
    }

    /** FIXME: this is required to keep compatibility with BaseField type */
    const nodeAuth = new NodeAuth(entity.auth);
    const authRules = nodeAuth.getRules(operations);

    const hasWhere = (rule: BaseAuthRule): boolean =>
        !!(rule.where || rule.AND?.some(hasWhere) || rule.OR?.some(hasWhere));

    if (where && !authRules.some(hasWhere)) {
        return undefined;
    }
    const subPredicates = authRules.map((authRule: AuthRule) => {
        const predicate = createSubPredicate({
            authRule,
            skipRoles,
            skipIsAuthenticated,
            allow,
            context,
            bind,
            where,
        });

        return predicate;
    });

    const orPredicates = Cypher.or(...subPredicates);
    if (!orPredicates) return undefined;

    const authPredicate = new Cypher.RawCypher((env: Cypher.Environment) => {
        return orPredicates.getCypher(env);
    });
    return authPredicate;
}

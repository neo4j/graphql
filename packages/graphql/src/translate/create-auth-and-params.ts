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
import type { Node } from "../classes";
import type { BaseField, Context } from "../types";
import type { AuthOperations } from "../types/deprecated/auth/auth-operations";
import type { Rule } from "./deprecated/auth/types";
import { createAuthPredicates } from "./create-auth-predicates";

type AuthAndParams = {
    cypher: string;
    params: Record<string, any>;
};

export function createAuthAndParams({
    entity,
    operations,
    skipRoles,
    skipIsAuthenticated,
    allow,
    context,
    escapeQuotes,
    bind,
    where,
}: {
    entity: Node | BaseField;
    operations?: AuthOperations | AuthOperations[];
    skipRoles?: boolean;
    skipIsAuthenticated?: boolean;
    allow?: Rule;
    context: Context;
    escapeQuotes?: boolean;
    bind?: Rule;
    where?: Rule;
}): AuthAndParams {
    const authPredicate = createAuthPredicates({
        entity,
        operations,
        skipRoles,
        skipIsAuthenticated,
        allow,
        context,
        escapeQuotes,
        bind,
        where,
    });
    if (!authPredicate) {
        return {
            cypher: "",
            params: {},
        };
    }

    const authPredicateExpr = new Cypher.RawCypher((env: Cypher.Environment) => {
        return authPredicate.getCypher(env);
    });

    const chainStr = generateUniqueChainStr([where?.varName, allow?.varName, bind?.varName]);

    // Params must be globally unique, variables can be just slightly different, as each auth statement is scoped
    const authCypher = authPredicateExpr.build({ params: `${chainStr}auth_`, variables: `auth_` });

    return { cypher: authCypher.cypher, params: authCypher.params };
}

function generateUniqueChainStr(varNames: Array<string | Cypher.Node | undefined>): string {
    return varNames
        .map((v) => {
            return typeof v === "string" ? v : "";
        })
        .join("");
}

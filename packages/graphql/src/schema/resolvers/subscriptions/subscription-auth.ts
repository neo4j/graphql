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

import { haveSharedElement } from "../../../utils/utils";
import createAuthParam from "../../../translate/create-auth-param";
import type { AuthRule } from "../../../types/deprecated/auth/auth-rule";
import type { SubscriptionContext } from "./types";

export class SubscriptionAuth {
    public static validateAuthenticationRule(rule: AuthRule, context: SubscriptionContext): boolean {
        const isAuthenticated = this.isAuthenticated(context);

        if (isAuthenticated) {
            return this.validateAuthenticated(rule);
        }

        return this.validateUnauthenticated(rule);
    }

    public static validateRolesRule(rule: AuthRule, context: SubscriptionContext): boolean {
        const authParams = createAuthParam({ context });
        const expectedRoles = rule.roles;

        if (!expectedRoles) {
            return true;
        }

        if (haveSharedElement(expectedRoles, authParams.roles)) {
            return true;
        }
        return false;
    }

    private static isAuthenticated(context: SubscriptionContext): boolean {
        return Boolean(context.jwt);
    }

    private static validateAuthenticated(rule: AuthRule): boolean {
        if (rule.isAuthenticated === false) {
            return false;
        }
        return true;
    }

    private static validateUnauthenticated(rule: AuthRule): boolean {
        if (rule.isAuthenticated && !rule.allowUnauthenticated) return false;
        return true;
    }
}

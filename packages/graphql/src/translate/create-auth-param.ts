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

import dotProp from "dot-prop";
import type { Context } from "../types";
import type { AuthContext } from "../types/deprecated/auth/auth-context";

type ContextAuthParams = Pick<Context, "jwt" | "plugins">;

function createAuthParam({
    context,
    authRolesPath,
}: {
    context: ContextAuthParams;
    authRolesPath?: string;
}): AuthContext {
    const { jwt } = context;
    const param: AuthContext = {
        isAuthenticated: false,
        roles: [],
        jwt,
    };

    if (!jwt) {
        return param;
    }

    // If any role is defined in this parameter, isAuthenticated shall be true
    param.isAuthenticated = true;

    const rolesPath = authRolesPath || context?.plugins?.auth?.rolesPath;

    // Roles added to config come from the role path or a roles array
    if (rolesPath) {
        param.roles = dotProp.get(jwt as unknown as { [key: string]: any }, rolesPath, []);
    } else if (jwt.roles) {
        param.roles = jwt.roles;
    }

    return param;
}

export default createAuthParam;

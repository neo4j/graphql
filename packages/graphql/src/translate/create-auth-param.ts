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
import { Context } from "../types";
import environment from "../environment";

function createAuthParam({ context }: { context: Context }) {
    const { jwt } = context;
    const param: { isAuthenticated: boolean; roles?: string[]; jwt: any } = {
        isAuthenticated: false,
        roles: [],
        jwt,
    };

    if (!jwt) {
        return param;
    }

    if (environment.NEO4j_GRAPHQL_JWT_ROLES_OBJECT_PATH) {
        param.roles = dotProp.get(jwt, environment.NEO4j_GRAPHQL_JWT_ROLES_OBJECT_PATH);
    } else if (jwt.roles) {
        param.roles = jwt.roles;
    }

    param.isAuthenticated = true;

    return param;
}

export default createAuthParam;

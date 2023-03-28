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

import type { AuthorizationOperation } from "../../../types/authorization";
import type { AuthOperations } from "../../../types/deprecated/auth/auth-operations";
import { asArray } from "../../../utils/utils";

export function authOperationsToAuthorizationOperations(
    authOperations: AuthOperations | AuthOperations[]
): AuthorizationOperation[] {
    const operations = asArray(authOperations);

    return operations.map((operation) => {
        if (operation === "SUBSCRIBE") {
            throw new Error("SUBSCRIBE is not a support authorization operation");
        }

        if (operation === "CONNECT") {
            return "CREATE_RELATIONSHIP";
        }

        if (operation === "DISCONNECT") {
            return "DELETE_RELATIONSHIP";
        }

        return operation;
    });
}

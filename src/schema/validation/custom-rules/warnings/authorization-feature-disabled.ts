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

import type { ASTVisitor, DirectiveNode } from "graphql";
import type { Neo4jAuthorizationSettings } from "../../../../types";

export function WarnIfAuthorizationFeatureDisabled(authorization: Neo4jAuthorizationSettings | undefined) {
    return function (): ASTVisitor {
        let warningAlreadyIssued = false;

        return {
            Directive(directive: DirectiveNode) {
                if (
                    !warningAlreadyIssued &&
                    !authorization &&
                    ["authentication", "authorization", "subscriptionsAuthorization"].includes(directive.name.value)
                ) {
                    console.warn(
                        "'@authentication', '@authorization' and/or @subscriptionsAuthorization detected - please ensure that you either specify authorization settings in 'features.authorization'. This warning can be ignored if you intend to pass a decoded JWT into 'context.jwt' on every request."
                    );
                    warningAlreadyIssued = true;
                }
            },
        };
    };
}

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

import type { ASTVisitor } from "graphql";

export function WarnIfExperimentalMode(experimental: boolean) {
    return function (): ASTVisitor {
        let warningAlreadyIssued = false;

        return {
            Document() {
                if (experimental === true && !warningAlreadyIssued) {
                    console.warn(
                        "You have enabled experimental features of the Neo4j GraphQL Library. Be aware that experimental features may be incomplete and/or contain bugs, and that breaking changes may be introduced at any time."
                    );

                    warningAlreadyIssued = true;
                }
                return false;
            },
        };
    };
}

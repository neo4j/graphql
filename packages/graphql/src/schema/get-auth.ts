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

import { DirectiveNode, valueFromASTUntyped } from "graphql";
import { Auth, AuthRule } from "../types";

function getAuth(directive: DirectiveNode): Auth {
    const auth: Auth = { rules: [], type: "JWT" };

    const rules = directive.arguments?.find((x) => x.name.value === "rules");

    if (!rules) {
        throw new Error("auth rules required");
    }

    if (rules.value.kind !== "ListValue") {
        throw new Error("auth rules must be a ListValue");
    }

    auth.rules = valueFromASTUntyped(rules.value) as AuthRule[];

    return auth;
}

export default getAuth;

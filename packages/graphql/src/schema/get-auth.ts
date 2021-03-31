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
import { Auth, AuthRule, AuthOperations } from "../types";

const validOperations: AuthOperations[] = ["CREATE", "READ", "UPDATE", "DELETE", "CONNECT", "DISCONNECT"];
const validFields = ["operations", "AND", "OR", "allow", "where", "bind", "isAuthenticated", "roles"];

function getAuth(directive: DirectiveNode): Auth {
    const auth: Auth = { rules: [], type: "JWT" };

    const rules = directive.arguments?.find((x) => x.name.value === "rules");

    if (!rules) {
        throw new Error("auth rules required");
    }

    if (rules.value.kind !== "ListValue") {
        throw new Error("auth rules must be a ListValue");
    }

    rules.value.values.forEach((rule) => {
        if (rule.kind !== "ObjectValue") {
            throw new Error("auth rules rule should be a Object Value");
        }

        rule.fields.forEach((field) => {
            if (field.name.value !== "operations") {
                if (!validFields.includes(field.name.value)) {
                    throw new Error(`auth rules rule invalid field ${field.name.value}`);
                }

                return;
            }

            if (field.value.kind !== "ListValue") {
                throw new Error("auth rules rule operations should be a ListValue");
            }

            field.value.values.forEach((value) => {
                if (value.kind !== "EnumValue") {
                    throw new Error("auth rules rule operations operation should be a EnumValue");
                }

                if (!validOperations.includes(value.value as AuthOperations)) {
                    throw new Error(`auth rules rule operations operation invalid ${value.value}`);
                }
            });
        });
    });

    auth.rules = valueFromASTUntyped(rules.value) as AuthRule[];

    return auth;
}

export default getAuth;

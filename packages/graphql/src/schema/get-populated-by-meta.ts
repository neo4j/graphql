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

import type { DirectiveNode, ArgumentNode, ListValueNode, StringValueNode } from "graphql";
import type { Callback, CallbackOperations, Neo4jGraphQLCallbacks } from "../types";

export function getPopulatedByMeta(directive: DirectiveNode, callbacks?: Neo4jGraphQLCallbacks): Callback {
    const operationsArg = directive.arguments?.find((x) => x.name.value === "operations") as ArgumentNode;
    const callbackArg = directive.arguments?.find((x) => x.name.value === "callback") as ArgumentNode;

    const operationsList = operationsArg.value as ListValueNode;
    const operations = operationsList.values.map((value) => (value as StringValueNode).value) as CallbackOperations[];
    const callbackName = (callbackArg?.value as StringValueNode)?.value;

    if (typeof (callbacks || {})[callbackName] !== "function") {
        throw new Error(`PopulatedBy callback '${callbackName}' must be of type function`);
    }

    return {
        operations,
        callbackName,
    };
}

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

import type { Directive } from "graphql-compose";
import { RelationshipQueryDirectionOption } from "../constants";
import type { RelationshipAdapter } from "../schema-model/relationship/model-adapters/RelationshipAdapter";
import { RelationshipDeclarationAdapter } from "../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { Neo4jFeaturesSettings } from "../types";
import { DEPRECATE_DIRECTED_ARGUMENT } from "./constants";
import { shouldAddDeprecatedFields } from "./generation/utils";

type DirectedArgument = {
    type: "Boolean";
    defaultValue: boolean;
    directives: Directive[];
};

export function getDirectedArgument(
    relationshipAdapter: RelationshipAdapter,
    features: Neo4jFeaturesSettings | undefined
): DirectedArgument | undefined {
    let defaultValue: boolean;
    switch (relationshipAdapter.queryDirection) {
        case RelationshipQueryDirectionOption.DEFAULT_DIRECTED:
            defaultValue = true;
            break;
        case RelationshipQueryDirectionOption.DEFAULT_UNDIRECTED:
            defaultValue = false;
            break;
        default:
            return undefined;
    }

    if (shouldAddDeprecatedFields(features, "directedArgument")) {
        return {
            type: "Boolean",
            defaultValue,
            directives: [DEPRECATE_DIRECTED_ARGUMENT],
        };
    }
}

export function addDirectedArgument<T extends Record<string, any>>(
    args: T,
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter,
    features: Neo4jFeaturesSettings | undefined
): T & { directed?: DirectedArgument } {
    if (relationshipAdapter instanceof RelationshipDeclarationAdapter) {
        return { ...args };
    }

    const directedArg = getDirectedArgument(relationshipAdapter, features);
    if (directedArg) {
        return { ...args, directed: directedArg };
    }

    return { ...args };
}

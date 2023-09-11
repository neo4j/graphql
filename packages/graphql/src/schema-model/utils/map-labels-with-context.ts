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
import type { Neo4jGraphQLContext } from "../../types/neo4j-graphql-context";
/**
 * Given a list of strings, representing labels, and a context, replace any labels that start with $ with the value from the context
 **/
export function mapLabelsWithContext(labels: string[], context: Neo4jGraphQLContext): string[] {
    return labels.map((label: string) => {
        if (label.startsWith("$")) {
            // Trim $context. OR $ off the beginning of the string
            const path = label.substring(label.startsWith("$context") ? 9 : 1);
            const labelValue = searchLabel(context, path);
            if (!labelValue) {
                throw new Error(`Label value not found in context.`);
            }
            return labelValue;
        }

        return label;
    });
}

function searchLabel(context: Neo4jGraphQLContext, path: string): string | undefined {
    // Search for the key at the root of the context
    let labelValue = dotProp.get<string>(context, path);
    if (!labelValue) {
        // Search for the key in cypherParams
        labelValue = dotProp.get<string>(context.cypherParams, path);
    }
    return labelValue;
}

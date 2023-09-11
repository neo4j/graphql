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

import { Neo4jGraphQLError } from "./Error";
import Cypher from "@neo4j/cypher-builder";
import type { Neo4jGraphQLContext } from "../types/neo4j-graphql-context";
import { mapLabelsWithContext } from "../schema-model/utils/map-labels-with-context";

export interface NodeDirectiveConstructor {
    labels?: string[];
}

export class NodeDirective {
    public readonly labels: string[];

    constructor(input: NodeDirectiveConstructor) {
        this.labels = input.labels || [];
    }

    public getLabelsString(typeName: string, context: Neo4jGraphQLContext): string {
        if (!typeName) {
            throw new Neo4jGraphQLError("Could not generate label string in @node directive due to empty typeName");
        }
        const labels = this.getLabels(typeName, context).map((label) => Cypher.utils.escapeLabel(label));
        return `:${labels.join(":")}`;
    }
    /**
     * Returns the list containing labels mapped with the values contained in the Context.
     * Be careful when using this method, labels returned are unescaped.
     **/
    public getLabels(typeName: string, context: Neo4jGraphQLContext): string[] {
        const labels = !this.labels.length ? [typeName] : this.labels;
        return mapLabelsWithContext(labels, context);
    }
}

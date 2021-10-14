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
import { Context } from "../types";
import ContextParser from "../utils/context-parser";

export interface NodeDirectiveConstructor {
    label?: string;
    additionalLabels?: string[];
    plural?: string;
}

export class NodeDirective {
    public readonly label: string | undefined;
    public readonly additionalLabels: string[];
    public readonly plural: string | undefined;

    constructor(input: NodeDirectiveConstructor) {
        this.label = input.label;
        this.additionalLabels = input.additionalLabels || [];
        this.plural = input.plural;
    }

    public getLabelsString(typeName: string, context: Context): string {
        if (!typeName) {
            throw new Neo4jGraphQLError("Could not generate label string in @node directive due to empty typeName");
        }
        const labels = this.getLabels(typeName, context);
        return `:${labels.join(":")}`;
    }

    public getLabels(typeName: string, context: Context): string[] {
        const mainLabel = this.label || typeName;
        const labels = [mainLabel, ...this.additionalLabels];
        return this.mapLabelsWithContext(labels, context);
    }

    private mapLabelsWithContext(labels: string[], context: Context): string[] {
        return labels.map((label: string) => {
            const jwtPath = ContextParser.parseTag(label, "jwt");
            const ctxPath = ContextParser.parseTag(label, "context");
            if (jwtPath) {
                return this.escapeLabel(ContextParser.getJwtPropery(jwtPath, context) || label);
            }
            if (ctxPath) {
                return this.escapeLabel(ContextParser.getContextProperty(ctxPath, context) || label);
            }
            return label;
        });
    }

    private escapeLabel(label: string): string {
        const escapedLabel = label.replace(/`/g, "");
        return `\`${escapedLabel}\``;
    }
}

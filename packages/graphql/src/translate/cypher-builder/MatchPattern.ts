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

import { CypherASTNode } from "./CypherASTNode";
import { CypherContext } from "./CypherContext";
import { Node, Relationship } from "./CypherBuilder";
import { serializeParameters } from "./references/utils";
import { escapeLabel, padLeft } from "./utils";

export type MatchableElement = Node | Relationship;

export class MatchPattern extends CypherASTNode {
    private matchElement: MatchableElement;

    constructor(input: MatchableElement) {
        super();
        this.matchElement = input;
    }

    protected cypher(context: CypherContext, childrenCypher: string): string {
        if (childrenCypher) throw new Error("Match pattern cannot have children nodes");
        if (this.matchElement instanceof Node) {
            return this.getNodeCypher(context, this.matchElement);
        }
        if (this.matchElement instanceof Relationship) {
            return this.getRelationshipCypher(context, this.matchElement);
        }
        throw new Error("Invalid element in match pattern");
    }

    private getRelationshipCypher(context: CypherContext, relationship: Relationship): string {
        const referenceId = context.getVariableId(relationship);
        let parametersStr = "";
        if (relationship.hasParameters()) {
            const parameters = serializeParameters(relationship.parameters, context);
            parametersStr = padLeft(parameters);
        }

        const sourceStr = `(${context.getVariableId(relationship.source)})`;
        const targetStr = `(${context.getVariableId(relationship.target)})`;
        const arrowStr = this.getRelationshipArrow(relationship);
        const relationshipStr = `${referenceId || ""}${this.getTypeString(relationship)}${parametersStr}`;

        return `${sourceStr}-[${relationshipStr}]${arrowStr}${targetStr}`;
    }

    private getRelationshipArrow(relationship: Relationship): "-" | "->" {
        return relationship.directed ? "->" : "-";
    }

    private getTypeString(relationship: Relationship): string {
        return relationship.type ? `:${escapeLabel(relationship.type)}` : "";
    }

    private getNodeCypher(context: CypherContext, node: Node): string {
        const referenceId = context.getVariableId(node);
        let parametersStr = "";
        if (node.hasParameters()) {
            const parameters = serializeParameters(node.parameters, context);
            parametersStr = padLeft(parameters);
        }
        return `(${referenceId}${node.getLabelsString()}${parametersStr})`;
    }
}

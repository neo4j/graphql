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
import { stringifyObject } from "../utils/stringify-object";
import { Node } from "./references/Node";
import { Relationship } from "./references/Relationship";
import { Param } from "./references/Param";
import { padLeft } from "./utils";

export type MatchableElement = Node | Relationship;

type MatchPatternOptions = {
    labels?: boolean;
    relationshipTypes?: boolean;
};

type ParamsRecord = Record<string, Param<any>>;

type MatchRelationshipParams = {
    source?: ParamsRecord;
    relationship?: ParamsRecord;
    target?: ParamsRecord;
};

export type MatchParams<T extends MatchableElement> = T extends Node ? ParamsRecord : MatchRelationshipParams;

export class MatchPattern<T extends MatchableElement> extends CypherASTNode {
    private matchElement: T;
    private parameters: MatchParams<T>;
    private options: MatchPatternOptions;

    constructor(input: T, options?: MatchPatternOptions) {
        super();
        this.matchElement = input;
        this.parameters = {} as MatchParams<T>; // Cast required due to neo-push
        this.options = { labels: true, relationshipTypes: true, ...options };
    }

    public withParams(parameters: MatchParams<T>): MatchPattern<T> {
        this.parameters = parameters;
        return this;
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

        const parameterOptions = this.parameters as MatchParams<Relationship>;
        const parameterStrs = {
            source: this.serializeParameters(parameterOptions.source || {}, context),
            relationship: this.serializeParameters(parameterOptions.relationship || {}, context),
            target: this.serializeParameters(parameterOptions.target || {}, context),
        };

        const labelsStr = {
            source: "",
            relationship: this.options.relationshipTypes ? relationship.getTypeString() : "",
            target: "",
        };

        if (this.options.labels) {
            labelsStr.source = relationship.source.getLabelsString();
            labelsStr.target = relationship.target.getLabelsString();
        }

        const sourceStr = `(${context.getVariableId(relationship.source)}${labelsStr.source}${parameterStrs.source})`;
        const targetStr = `(${context.getVariableId(relationship.target)}${labelsStr.target}${parameterStrs.target})`;
        const arrowStr = this.getRelationshipArrow(relationship);

        const relationshipStr = `${referenceId || ""}${labelsStr.relationship}${parameterStrs.relationship}`;

        return `${sourceStr}-[${relationshipStr}]${arrowStr}${targetStr}`;
    }

    private getRelationshipArrow(relationship: Relationship): "-" | "->" {
        return relationship.directed ? "->" : "-";
    }

    private getNodeCypher(context: CypherContext, node: Node): string {
        const referenceId = context.getVariableId(node);
        const parametersStr = this.serializeParameters(this.parameters as MatchParams<Node>, context);
        const nodeLabelString = this.options.labels ? node.getLabelsString() : "";

        return `(${referenceId}${nodeLabelString}${parametersStr})`;
    }

    private serializeParameters(parameters: MatchParams<Node>, context: CypherContext): string {
        if (Object.keys(this.parameters).length === 0) return "";
        const paramValues = Object.entries(parameters).reduce((acc, [key, param]) => {
            acc[key] = param.getCypher(context);
            return acc;
        }, {} as Record<string, string>);

        return padLeft(stringifyObject(paramValues));
    }
}

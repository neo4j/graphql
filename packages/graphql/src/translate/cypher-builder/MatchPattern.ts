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

type ItemOption = { labels?: boolean; variable?: boolean };

// TODO: improve options
type MatchPatternOptions = {
    source?: ItemOption;
    target?: ItemOption;
    relationship?: {
        type?: boolean;
        variable?: boolean;
    };
};

type ParamsRecord = Record<string, Param<any>>;

type MatchRelationshipParams = {
    source?: ParamsRecord;
    relationship?: ParamsRecord;
    target?: ParamsRecord;
};

export type MatchParams<T extends MatchableElement> = T extends Node ? ParamsRecord : MatchRelationshipParams;

export class MatchPattern<T extends MatchableElement> extends CypherASTNode {
    public readonly matchElement: T;
    private parameters: MatchParams<T>;
    private options: MatchPatternOptions; // TODO: fix typings, this is not undefined

    constructor(input: T, options?: MatchPatternOptions) {
        super();
        this.matchElement = input;
        this.parameters = {} as MatchParams<T>; // Cast required due to neo-push

        const sourceOptions = {
            labels: true,
            variable: true,
            ...(options?.source || {}),
        };
        const targetOptions = {
            labels: true,
            variable: true,
            ...(options?.target || {}),
        };
        const relationshipOption = {
            type: true,
            variable: true,
            ...(options?.relationship || {}),
        };

        this.options = {
            source: sourceOptions,
            target: targetOptions,
            relationship: relationshipOption,
        };
    }

    public withParams(parameters: MatchParams<T>): MatchPattern<T> {
        this.parameters = parameters;
        return this;
    }

    protected cypher(context: CypherContext, childrenCypher: string): string {
        if (childrenCypher) throw new Error("Match pattern cannot have children nodes");
        if (this.matchElement instanceof Node) {
            return this.getNodeCypher(context, this.matchElement, this.parameters as MatchParams<Node>);
        }
        if (this.matchElement instanceof Relationship) {
            return this.getRelationshipCypher(context, this.matchElement);
        }
        throw new Error("Invalid element in match pattern");
    }

    private getRelationshipCypher(context: CypherContext, relationship: Relationship): string {
        const referenceId = this.options?.relationship?.variable ? context.getVariableId(relationship) : "";

        const parameterOptions = this.parameters as MatchParams<Relationship>;
        const relationshipParamsStr = this.serializeParameters(parameterOptions.relationship || {}, context);

        const relationshipType = this.options.relationship?.type ? relationship.getTypeString() : "";

        const sourceStr = this.getNodeCypher(context, relationship.source, parameterOptions.source, "source");
        const targetStr = this.getNodeCypher(context, relationship.target, parameterOptions.target, "target");
        const arrowStr = this.getRelationshipArrow(relationship);

        const relationshipStr = `${referenceId}${relationshipType}${relationshipParamsStr}`;

        return `${sourceStr}-[${relationshipStr}]${arrowStr}${targetStr}`;
    }

    private getRelationshipArrow(relationship: Relationship): "-" | "->" {
        return relationship.directed ? "->" : "-";
    }

    private getNodeCypher(
        context: CypherContext,
        node: Node,
        parameters: ParamsRecord | undefined,
        item: "source" | "target" = "source"
    ): string {
        const nodeOptions = this.options[item] as ItemOption;

        const referenceId = nodeOptions.variable ? context.getVariableId(node) : "";
        const parametersStr = this.serializeParameters(parameters || {}, context);
        const nodeLabelString = nodeOptions.labels ? node.getLabelsString() : "";

        return `(${referenceId}${nodeLabelString}${parametersStr})`;
    }

    private serializeParameters(parameters: ParamsRecord, context: CypherContext): string {
        console.log(parameters);
        if (Object.keys(parameters).length === 0) return "";
        const paramValues = Object.entries(parameters).reduce((acc, [key, param]) => {
            acc[key] = param.getCypher(context);
            return acc;
        }, {} as Record<string, string>);

        return padLeft(stringifyObject(paramValues));
    }
}

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
import { stringifyObject } from "../utils/stringify-object";
import { padLeft } from "./utils";
import type { NodeRef } from "./variables/NodeRef";
import type { RelationshipRef } from "./variables/RelationshipRef";
import type { CypherEnvironment } from "./Environment";
import type { Param } from "./variables/Param";

export type MatchableElement = NodeRef | RelationshipRef;

type ItemOption = { labels?: boolean; variable?: boolean };

export type MatchPatternOptions = {
    source?: ItemOption;
    target?: ItemOption;
    relationship?: {
        type?: boolean;
        variable?: boolean;
    };
    directed?: boolean;
};

type ParamsRecord = Record<string, Param<any>>;

type MatchRelationshipParams = {
    source?: ParamsRecord;
    relationship?: ParamsRecord;
    target?: ParamsRecord;
};

export type MatchParams<T extends MatchableElement> = T extends NodeRef ? ParamsRecord : MatchRelationshipParams;

export class Pattern<T extends MatchableElement = any> extends CypherASTNode {
    public readonly matchElement: T;
    private parameters: MatchParams<T>;
    private options: MatchPatternOptions;

    constructor(input: T, options?: MatchPatternOptions) {
        super();
        this.matchElement = input;
        this.parameters = {};

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
            directed: options?.directed,
        };
    }

    public withParams(parameters: MatchParams<T>): this {
        this.parameters = parameters;
        return this;
    }

    public getCypher(env: CypherEnvironment): string {
        if (this.isRelationship(this.matchElement)) {
            return this.getRelationshipCypher(env, this.matchElement);
        }
        return this.getNodeCypher(env, this.matchElement, this.parameters as MatchParams<NodeRef>);
    }

    private getRelationshipCypher(env: CypherEnvironment, relationship: RelationshipRef): string {
        const referenceId = this.options?.relationship?.variable ? env.getVariableId(relationship) : "";

        const parameterOptions = this.parameters as MatchParams<RelationshipRef>;
        const relationshipParamsStr = this.serializeParameters(parameterOptions.relationship || {}, env);

        const relationshipType = this.options.relationship?.type ? relationship.getTypeString() : "";

        const sourceStr = this.getNodeCypher(env, relationship.source, parameterOptions.source, "source");
        const targetStr = this.getNodeCypher(env, relationship.target, parameterOptions.target, "target");
        const arrowStr = this.getRelationshipArrow();

        const relationshipStr = `${referenceId}${relationshipType}${relationshipParamsStr}`;

        return `${sourceStr}-[${relationshipStr}]${arrowStr}${targetStr}`;
    }

    private getRelationshipArrow(): "-" | "->" {
        return this.options.directed === false ? "-" : "->";
    }

    // Note: This allows us to remove cycle dependency between pattern and relationship
    private isRelationship(x: NodeRef | RelationshipRef): x is RelationshipRef {
        return Boolean((x as any).source);
    }

    private getNodeCypher(
        env: CypherEnvironment,
        node: NodeRef,
        parameters: ParamsRecord | undefined,
        item: "source" | "target" = "source"
    ): string {
        const nodeOptions = this.options[item] as ItemOption;

        const referenceId = nodeOptions.variable ? env.getVariableId(node) : "";
        const parametersStr = this.serializeParameters(parameters || {}, env);
        const nodeLabelString = nodeOptions.labels ? node.getLabelsString() : "";

        return `(${referenceId}${nodeLabelString}${parametersStr})`;
    }

    private serializeParameters(parameters: ParamsRecord, env: CypherEnvironment): string {
        if (Object.keys(parameters).length === 0) return "";
        const paramValues = Object.entries(parameters).reduce((acc, [key, param]) => {
            acc[key] = param.getCypher(env);
            return acc;
        }, {} as Record<string, string>);

        return padLeft(stringifyObject(paramValues));
    }
}

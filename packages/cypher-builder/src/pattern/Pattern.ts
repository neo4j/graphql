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

import { stringifyObject } from "../utils/stringify-object";
import { escapeLabel } from "../utils/escape-label";
import { padLeft } from "../utils/pad-left";
import type { RelationshipRef } from "../references/RelationshipRef";
import type { CypherEnvironment } from "../Environment";
import type { Param } from "../references/Param";
import type { CypherCompilable } from "../types";
import type { NodeRef } from "../references/NodeRef";

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

/** Represents a MATCH pattern
 * @group Other
 */
export class Pattern<T extends MatchableElement = MatchableElement> implements CypherCompilable {
    public readonly matchElement: T;
    private parameters: MatchParams<T>;
    private options: MatchPatternOptions;
    private reversed = false;

    constructor(input: T, options?: MatchPatternOptions) {
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

    /**
     * @hidden
     */
    public getCypher(env: CypherEnvironment): string {
        if (this.isRelationship(this.matchElement)) {
            return this.getRelationshipCypher(env, this.matchElement);
        }
        return this.getNodeCypher(env, this.matchElement, this.parameters as MatchParams<NodeRef>);
    }

    /** Reverses the pattern direction, not the underlying relationship */
    public reverse() {
        if (!this.isRelationshipPattern()) throw new Error("Cannot reverse a node pattern");
        this.reversed = true;
    }

    private isRelationshipPattern(): this is Pattern<RelationshipRef> {
        return (this.matchElement as any).source;
    }

    private getRelationshipCypher(env: CypherEnvironment, relationship: RelationshipRef): string {
        const referenceId = this.options?.relationship?.variable ? env.getReferenceId(relationship) : "";

        const parameterOptions = this.parameters as MatchParams<RelationshipRef>;
        const relationshipParamsStr = this.serializeParameters(parameterOptions.relationship || {}, env);

        const relationshipType = this.options.relationship?.type ? this.getRelationshipTypesString(relationship) : "";

        const sourceStr = this.getNodeCypher(env, relationship.source, parameterOptions.source, "source");
        const targetStr = this.getNodeCypher(env, relationship.target, parameterOptions.target, "target");
        const arrowStrs = this.getRelationshipArrows();

        const relationshipStr = `${referenceId}${relationshipType}${relationshipParamsStr}`;

        return `${sourceStr}${arrowStrs[0]}[${relationshipStr}]${arrowStrs[1]}${targetStr}`;
    }

    private getRelationshipArrows(): ["<-" | "-", "-" | "->"] {
        if (this.options.directed === false) return ["-", "-"];
        if (this.reversed) return ["<-", "-"];
        return ["-", "->"];
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

        const referenceId = nodeOptions.variable ? env.getReferenceId(node) : "";
        const parametersStr = this.serializeParameters(parameters || {}, env);
        const nodeLabelString = nodeOptions.labels ? this.getNodeLabelsString(node) : "";

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

    private getNodeLabelsString(node: NodeRef): string {
        const escapedLabels = node.labels.map(escapeLabel);
        if (escapedLabels.length === 0) return "";
        return `:${escapedLabels.join(":")}`;
    }

    private getRelationshipTypesString(relationship: RelationshipRef): string {
        // TODO: escapeLabel
        return relationship.type ? `:${relationship.type}` : "";
    }
}

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

import { CypherContext } from "../CypherContext";
import { Node } from "../references/Node";
import { Param } from "../references/Param";
import { Relationship } from "../references/Relationship";
import { Query } from "./Query";

type ParamsRecord = Record<string, Param<any>>;

type OnCreateRelationshipParameters = {
    source: ParamsRecord;
    target: ParamsRecord;
    relationship: ParamsRecord;
};

export class Merge<T extends Node | Relationship> extends Query {
    private element: T;
    private onCreateParameters: OnCreateRelationshipParameters = { source: {}, target: {}, relationship: {} };

    constructor(element: T, parent?: Query) {
        super(parent);
        this.element = element;
    }

    public cypher(context: CypherContext, childrenCypher: string): string {
        const mergeStr = `MERGE ${this.element.getCypher(context)}`;
        const onCreateSetStatement = this.onCreateSetStatement(context);
        const separator = onCreateSetStatement ? "\n" : "";

        return `${mergeStr}${separator}${onCreateSetStatement}\n${childrenCypher}`;
    }

    public onCreate(onCreate: T extends Node ? ParamsRecord : Partial<OnCreateRelationshipParameters>) {
        let parameters: Partial<OnCreateRelationshipParameters>;
        if (this.element instanceof Node) {
            parameters = { source: onCreate as ParamsRecord };
        } else {
            parameters = onCreate;
        }

        this.mergeOnCreateParamenters(parameters);
        return this;
    }

    private mergeOnCreateParamenters(options: Partial<OnCreateRelationshipParameters>): void {
        this.onCreateParameters = {
            source: { ...this.onCreateParameters.source, ...(options.source || {}) },
            target: { ...this.onCreateParameters.target, ...(options.target || {}) },
            relationship: { ...this.onCreateParameters.relationship, ...(options.relationship || {}) },
        };
    }

    private onCreateSetStatement(context: CypherContext): string {
        const source = this.element instanceof Relationship ? this.element.source : this.element;
        const sourceId = context.getVariableId(source);

        let onCreateStatements: Array<string> = Object.entries(this.onCreateParameters.source).map(([key, value]) => {
            return `${sourceId}.${key} = ${value.getCypher(context)}`;
        });

        if (this.element instanceof Relationship) {
            const relationshipId = context.getVariableId(this.element);
            const relationshipOnCreateStatements = Object.entries(this.onCreateParameters.relationship).map(
                ([key, value]) => {
                    return `${relationshipId}.${key} = ${value.getCypher(context)}`;
                }
            );

            const targetOnCreateStatements = Object.entries(this.onCreateParameters.target).map(([key, value]) => {
                return `${relationshipId}.${key} = ${value.getCypher(context)}`;
            });

            onCreateStatements = [
                ...onCreateStatements,
                ...relationshipOnCreateStatements,
                ...targetOnCreateStatements,
            ];
        }

        if (onCreateStatements.length === 0) return "";

        return `ON CREATE SET
        ${onCreateStatements.join(",\n")}`;
    }
}

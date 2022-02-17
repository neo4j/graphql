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

import { Node, Param, Relationship } from "./cypher-builder-references";
import { CypherASTNode, CypherASTRoot } from "./cypher-builder-types";
import { CypherContext } from "./CypherContext";

export { Node, Param, Relationship } from "./cypher-builder-references";

type Params = Record<string, Param<any>>;

export class Query extends CypherASTRoot {
    public create(node: Node, params: Params): Query {
        const createStatement = new CreateStatement(this, node, params);
        this.addStatement(createStatement);
        return this;
    }

    public call(query: CypherASTRoot): Query {
        this.addStatement(new CallStatement(this, query));
        return this;
    }

    public merge<T extends Node | Relationship>(element: T): MergeStatement<T> {
        return this.addStatement(new MergeStatement(this, element));
    }

    public return(...args: ReturnStatementArgs) {
        const returnStatement = new ReturnStatement(this, args);
        this.addStatement(returnStatement);
        return this.getRoot();
    }
}

class CallStatement extends CypherASTNode {
    private query: CypherASTRoot;

    constructor(parent: CypherASTRoot, query: CypherASTRoot) {
        super(parent);
        this.query = query;
    }

    public getCypher(context: CypherContext): string {
        return `CALL { ${this.query.getCypher(context)} }`;
    }
}

class CreateStatement extends CypherASTNode {
    constructor(parent: CypherASTRoot, private node: Node, private params: Params) {
        super(parent);
    }

    public getCypher(context: CypherContext): string {
        const nodeCypher = this.node.getCypher(context);

        return `CREATE ${nodeCypher}\n${this.composeSet(context)}`;
    }

    private composeSet(context: CypherContext): string {
        const nodeAlias = context.getReferenceId(this.node);
        const params = Object.entries(this.params).map(([key, value]) => {
            return `${nodeAlias}.${key} = ${value instanceof Param ? value.getCypher(context) : value}`;
        });
        if (params.length === 0) return "";
        else return `SET ${params.join(",\n")}`;
    }
}

type ReturnStatementArgs = [Node, Array<string>?, string?];

class ReturnStatement extends CypherASTNode {
    private returnArgs: ReturnStatementArgs;

    constructor(parent: CypherASTNode | CypherASTRoot, args: ReturnStatementArgs) {
        super(parent);
        this.returnArgs = args;
    }

    public getCypher(context: CypherContext): string {
        let projection = "";
        let alias = "";
        if ((this.returnArgs[1] || []).length > 0) {
            projection = ` {${(this.returnArgs[1] as Array<string>).map((s) => `.${s}`).join(", ")}}`;
        }

        if ((this.returnArgs[2] || []).length > 0) {
            alias = ` AS ${this.returnArgs[2]}`;
        }
        const nodeAlias = context.getReferenceId(this.returnArgs[0]);

        return `RETURN ${nodeAlias}${projection}${alias}`;
    }
}

type ParamsRecord = Record<string, Param<any>>;

type OnCreateParameters = {
    source: ParamsRecord;
    target: ParamsRecord;
    relationship: ParamsRecord;
};

class MergeStatement<T extends Node | Relationship> extends CypherASTNode {
    private element: T;

    private onCreateParameters: OnCreateParameters = { source: {}, target: {}, relationship: {} };

    constructor(parent: CypherASTRoot, element: T) {
        super(parent);
        this.element = element;
    }

    public getCypher(context: CypherContext): string {
        const mergeStr = `MERGE ${this.element.getCypher(context)}`;
        const onCreateSetStatement = this.onCreateSetStatement(context);
        const separator = onCreateSetStatement ? "\n" : "";

        return `${mergeStr}${separator}${onCreateSetStatement}`;
    }

    public onCreate<Node>(onCreate: ParamsRecord): MergeStatement<T>;
    public onCreate<Relationship>(onCreate: Partial<OnCreateParameters>): MergeStatement<T>;
    public onCreate<T>(onCreate: Partial<OnCreateParameters> | ParamsRecord): MergeStatement<Node | Relationship> {
        let parameters: Partial<OnCreateParameters>;

        if (this.element instanceof Node) {
            parameters = { source: onCreate as ParamsRecord };
        } else {
            parameters = onCreate;
        }

        this.mergeOnCreateParamenters(parameters);
        return this;
    }

    private mergeOnCreateParamenters(options: Partial<OnCreateParameters>): void {
        this.onCreateParameters = {
            source: { ...this.onCreateParameters.source, ...(options.source || {}) },
            target: { ...this.onCreateParameters.target, ...(options.target || {}) },
            relationship: { ...this.onCreateParameters.relationship, ...(options.relationship || {}) },
        };
    }

    private onCreateSetStatement(context: CypherContext): string {
        const source = this.element instanceof Relationship ? this.element.source : this.element;
        const sourceId = context.getReferenceId(source);

        let onCreateStatements: Array<string> = Object.entries(this.onCreateParameters.source).map(([key, value]) => {
            return `${sourceId}.${key} = ${value.getCypher(context)}`;
        });

        if (this.element instanceof Relationship) {
            const relationshipId = context.getReferenceId(this.element);
            const relationshipOnCreateStatements = Object.entries(this.onCreateParameters.relationship).map(
                ([key, value]) => {
                    return `${relationshipId}.${key} = ${value.getCypher(context)}`;
                }
            );

            const targetId = context.getReferenceId(this.element.target);
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
        ${onCreateStatements.join("\n")}`;
    }
}

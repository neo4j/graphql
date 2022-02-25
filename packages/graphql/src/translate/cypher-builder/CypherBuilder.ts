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

import { joinStrings } from "../../utils/utils";
import { Node, Param, Relationship } from "./cypher-builder-references";
import { CypherASTNode, CypherResult } from "./cypher-builder-types";
import { CypherContext } from "./CypherContext";

export { NamedNode, Node, Param, Relationship, RawParam } from "./cypher-builder-references";
export { CypherResult } from "./cypher-builder-types";

type Params = Record<string, Param<any>>;

export class Query extends CypherASTNode {
    public cypher(_context: CypherContext, childrenCypher: string): string {
        return childrenCypher;
    }

    public concat(query: CypherASTNode | undefined): this {
        if (query) {
            this.addStatement(query);
        }
        return this;
    }

    public build(prefix?: string): CypherResult {
        if (this.isRoot) {
            const context = this.getContext(prefix);
            const cypher = this.getCypher(context);
            return {
                cypher,
                params: context.getParams(),
            };
        }
        const root = this.getRoot() as Query;
        return root.build(prefix);
    }
}

export class Create extends Query {
    constructor(private node: Node, private params: Params, parent?: Query) {
        super(parent);
    }

    public cypher(context: CypherContext, childrenCypher: string): string {
        const nodeCypher = this.node.getCypher(context);
        return `CREATE ${nodeCypher}\n${this.composeSet(context)}\n${childrenCypher}`;
    }

    public return(...args: ReturnStatementArgs) {
        const returnStatement = new ReturnStatement(this, args);
        this.addStatement(returnStatement);
        return this;
    }

    private composeSet(context: CypherContext): string {
        const nodeAlias = context.getReferenceId(this.node);
        const params = Object.entries(this.params).map(([key, value]) => {
            return `${nodeAlias}.${key} = ${value instanceof Param ? value.getCypher(context) : value}`;
        });
        if (params.length === 0) return "";
        return `SET ${params.join(",\n")}`;
    }
}

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

export class Call extends Query {
    private withStatement: string | undefined;
    private returnStatement: string;

    constructor(query: Query, withStatement?: string, returnStatement = "RETURN COUNT(*)", parent?: Query) {
        super(parent);
        this.withStatement = withStatement;
        this.returnStatement = returnStatement;
        this.addStatement(query);
    }

    public cypher(_context: CypherContext, childrenCypher: string): string {
        const withStr = this.withStatement ? `WITH ${this.withStatement}` : "";
        return joinStrings([
            withStr,
            "CALL {",
            `\t${withStr}`,
            `\t${childrenCypher}`,
            `\t${this.returnStatement}`,
            "}",
        ]);
    }
}

type ReturnStatementArgs = [Node, Array<string>?, string?];

class ReturnStatement extends CypherASTNode {
    private returnArgs: ReturnStatementArgs;

    constructor(parent: CypherASTNode, args: ReturnStatementArgs) {
        super(parent);
        this.returnArgs = args;
    }

    public cypher(context: CypherContext): string {
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

export class ApocValidate extends Query {
    options: ApocValidateOptions;

    constructor(options: ApocValidateOptions, parent?: CypherASTNode) {
        super(parent);
        this.options = options;
    }

    public cypher(_context: CypherContext, childrenCypher: string): string {
        const statements = [this.options.predicate, `"${this.options.message}"`, "[0]"].join(", ");

        return `CALL apoc.util.validate(${statements})\n${childrenCypher}`;
    }
}

type ParamsRecord = Record<string, Param<any>>;

type OnCreateRelationshipParameters = {
    source: ParamsRecord;
    target: ParamsRecord;
    relationship: ParamsRecord;
};

type ApocValidateOptions = {
    predicate: string;
    message: string;
};

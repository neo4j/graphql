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

import Cypher from "@neo4j/cypher-builder";
import type { Neo4jGraphQLContext } from "../../../types/neo4j-graphql-context";

type Scope = Map<string, Cypher.Variable>;

export class QueryASTEnv {
    private scopes = new Map<Cypher.Node | Cypher.Relationship, Scope>();
    public topLevelOperationName: "READ" | "CREATE" = "READ";
    public getScope(element: Cypher.Node | Cypher.Relationship): Scope {
        const scope = this.scopes.get(element);
        if (scope) {
            return scope;
        } else {
            const newScope: Scope = new Map();
            this.scopes.set(element, newScope);
            return newScope;
        }
    }
}

export class QueryASTContext {
    public readonly target?: Cypher.Node;
    public readonly relationship?: Cypher.Relationship;
    public readonly source?: Cypher.Node;
    public readonly returnVariable: Cypher.Variable;
    public readonly shouldCollect: boolean; // temporary hack to describe if we should collect the return variable (used for unwind create)

    public env: QueryASTEnv;
    public neo4jGraphQLContext: Neo4jGraphQLContext;

    constructor({
        target,
        relationship,
        source,
        env,
        neo4jGraphQLContext,
        returnVariable,
        shouldCollect,
    }: {
        target?: Cypher.Node;
        relationship?: Cypher.Relationship;
        source?: Cypher.Node;
        env?: QueryASTEnv;
        neo4jGraphQLContext: Neo4jGraphQLContext;
        returnVariable?: Cypher.Variable;
        shouldCollect?: boolean;
    }) {
        this.target = target;
        this.relationship = relationship;
        this.source = source;
        this.env = env ?? new QueryASTEnv();
        this.neo4jGraphQLContext = neo4jGraphQLContext;
        this.returnVariable = returnVariable ?? new Cypher.Variable();
        this.shouldCollect = shouldCollect ?? false;
    }

    public getRelationshipScope(): Scope {
        if (!this.relationship) throw new Error("Cannot get relationship scope on top-level context");
        return this.env.getScope(this.relationship);
    }

    public getTargetScope(): Scope {
        if (!this.target) throw new Error("Cannot get target scope on top-level context");
        return this.env.getScope(this.target);
    }

    public getScopeVariable(name: string): Cypher.Variable {
        const scope = this.getTargetScope();
        const scopeVar = scope.get(name);
        if (!scopeVar) {
            const newVar = new Cypher.Node(); // Using node to keep consistency with `this`
            scope.set(name, newVar);
            return newVar;
        }
        return scopeVar;
    }

    public push({
        relationship,
        target,
        returnVariable,
    }: {
        relationship: Cypher.Relationship;
        target: Cypher.Node;
        returnVariable?: Cypher.Variable;
    }): QueryASTContext {
        return new QueryASTContext({
            source: this.target,
            relationship: relationship,
            target: target,
            env: this.env,
            neo4jGraphQLContext: this.neo4jGraphQLContext,
            returnVariable,
        });
    }

    public setReturn(variable: Cypher.Variable): QueryASTContext {
        return new QueryASTContext({
            source: this.source,
            relationship: this.relationship,
            target: this.target,
            env: this.env,
            neo4jGraphQLContext: this.neo4jGraphQLContext,
            returnVariable: variable,
        });
    }
}

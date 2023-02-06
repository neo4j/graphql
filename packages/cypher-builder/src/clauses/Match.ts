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

import { MatchableElement, MatchParams, Pattern } from "../pattern/Pattern";
import { Clause } from "./Clause";
import { compileCypherIfExists } from "../utils/compile-cypher-if-exists";
import { WithReturn } from "./mixins/WithReturn";
import { mixin } from "./utils/mixin";
import { WithWhere } from "./mixins/WithWhere";
import { WithSet } from "./mixins/WithSet";
import { WithWith } from "./mixins/WithWith";
import { DeleteClause, DeleteInput } from "./sub-clauses/Delete";
import type { PropertyRef } from "../references/PropertyRef";
import { RemoveClause } from "./sub-clauses/Remove";
import type { CypherEnvironment } from "../Environment";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Match<T extends MatchableElement = any> extends WithReturn, WithWhere, WithSet, WithWith {}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/match/)
 * @group Clauses
 */
@mixin(WithReturn, WithWhere, WithSet, WithWith)
export class Match<T extends MatchableElement> extends Clause {
    private pattern: Pattern<T>;
    private deleteClause: DeleteClause | undefined;
    private removeClause: RemoveClause | undefined;
    private _optional = false;

    constructor(variable: T | Pattern<T>, parameters: MatchParams<T> = {}) {
        super();
        if (variable instanceof Pattern) {
            this.pattern = variable;
        } else {
            this.pattern = new Pattern(variable).withParams(parameters);
        }
    }

    /** Attach a DELETE subclause
     * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/delete/)
     */
    public delete(...deleteInput: DeleteInput): this {
        this.createDeleteClause(deleteInput);
        return this;
    }

    /** Attach a DETACH DELETE subclause
     * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/delete/)
     */
    public detachDelete(...deleteInput: DeleteInput): this {
        const deleteClause = this.createDeleteClause(deleteInput);
        deleteClause.detach();
        return this;
    }

    public remove(...properties: PropertyRef[]): this {
        this.removeClause = new RemoveClause(this, properties);
        return this;
    }

    /** Makes the clause an OPTIONAL MATCH
     * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/optional-match/)
     * @example
     * ```ts
     * new Cypher.Match(new Node({labels: ["Movie"]})).optional();
     * ```
     * _Cypher:_
     * ```cypher
     * OPTIONAL MATCH (this:Movie)
     * ```
     */
    public optional(): this {
        this._optional = true;
        return this;
    }

    /**
     * @hidden
     */
    public getCypher(env: CypherEnvironment): string {
        const nodeCypher = this.pattern.getCypher(env);

        const whereCypher = compileCypherIfExists(this.whereSubClause, env, { prefix: "\n" });
        const returnCypher = compileCypherIfExists(this.returnStatement, env, { prefix: "\n" });
        const setCypher = compileCypherIfExists(this.setSubClause, env, { prefix: "\n" });
        const withCypher = compileCypherIfExists(this.withStatement, env, { prefix: "\n" });
        const deleteCypher = compileCypherIfExists(this.deleteClause, env, { prefix: "\n" });
        const removeCypher = compileCypherIfExists(this.removeClause, env, { prefix: "\n" });
        const optionalMatch = this._optional ? "OPTIONAL " : "";

        return `${optionalMatch}MATCH ${nodeCypher}${whereCypher}${setCypher}${removeCypher}${deleteCypher}${withCypher}${returnCypher}`;
    }

    private createDeleteClause(deleteInput: DeleteInput): DeleteClause {
        this.deleteClause = new DeleteClause(this, deleteInput);
        return this.deleteClause;
    }
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/optional-match/)
 * @group Clauses
 */
export class OptionalMatch<T extends MatchableElement = any> extends Match<T> {
    constructor(variable: T | Pattern<T>, parameters: MatchParams<T> = {}) {
        super(variable, parameters);
        this.optional();
    }
}

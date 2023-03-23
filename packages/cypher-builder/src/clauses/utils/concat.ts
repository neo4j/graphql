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

import { filterTruthy } from "../../utils/filter-truthy";
import type { CypherASTNode } from "../../CypherASTNode";
import type { CypherEnvironment } from "../../Environment";
import { Clause } from "../Clause";

/** The result of multiple clauses concatenated with {@link concat}
 * @group Clauses
 */
export class CompositeClause extends Clause {
    private _children: CypherASTNode[];

    /**
     * @hidden
     */
    constructor(children: Array<Clause | undefined>, private separator: string) {
        super();
        this._children = [];
        this.concat(...children);
    }

    public concat(...clauses: Array<Clause | undefined>): this {
        const filteredChildren = this.filterClauses(clauses);
        this.addChildren(...filteredChildren);
        this._children = [...this._children, ...filteredChildren];
        return this;
    }

    public get empty(): boolean {
        return this._children.length === 0;
    }

    public get children(): Array<CypherASTNode> {
        return this._children;
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const childrenStrs = this._children.map((c) => c.getCypher(env));
        return childrenStrs.join(this.separator);
    }

    private filterClauses(clauses: Array<Clause | undefined>): CypherASTNode[] {
        const childrenRoots = filterTruthy(clauses).map((c) => c.getRoot());

        return this.filterEmptyComposite(childrenRoots).map((c) => {
            if (c instanceof CompositeClause) {
                return this.unwrapComposite(c);
            }
            return c;
        });
    }

    private filterEmptyComposite(children: Array<CypherASTNode>): Array<CypherASTNode> {
        return children.filter((c) => {
            if (c instanceof CompositeClause && c.empty) return false;
            return true;
        });
    }

    private unwrapComposite(clause: CompositeClause): CypherASTNode {
        if (clause.children.length === 1) {
            return clause.children[0];
        } else return clause;
    }
}

/** Concatenates multiple {@link Clause | clauses} into a single clause
 * @group Clauses
 */
export function concat(...clauses: Array<Clause | undefined>): CompositeClause {
    return new CompositeClause(clauses, "\n");
}

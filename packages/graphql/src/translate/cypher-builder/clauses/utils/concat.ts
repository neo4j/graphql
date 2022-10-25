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

import { filterTruthy } from "../../../../utils/utils";
import type { CypherASTNode } from "../../CypherASTNode";
import type { CypherEnvironment } from "../../Environment";
import { Clause } from "../Clause";

export class CompositeClause extends Clause {
    private children: CypherASTNode[];

    constructor(children: Array<Clause | undefined>, private separator: string) {
        super();
        this.children = [];
        this.concat(...children);
    }

    public concat(...clauses: Array<Clause | undefined>): this {
        const childrenRoots = filterTruthy(clauses).map((c) => c.getRoot());
        this.addChildren(...childrenRoots);
        this.children = [...this.children, ...childrenRoots];
        return this;
    }

    public get empty(): boolean {
        return this.children.length === 0;
    }

    public getCypher(env: CypherEnvironment): string {
        const childrenStrs = this.children.map((c) => c.getCypher(env));
        return childrenStrs.join(this.separator);
    }
}

/** Concatenates multiple clauses into a clause */
export function concat(...clauses: Array<Clause | undefined>): CompositeClause {
    return new CompositeClause(clauses, "\n");
}

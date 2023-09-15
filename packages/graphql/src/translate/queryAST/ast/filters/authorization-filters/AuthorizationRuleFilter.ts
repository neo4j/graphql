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
import { Filter } from "../Filter";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";

export class AuthorizationRuleFilter extends Filter {
    public children: Filter[];
    private requireAuthentication: boolean;
    private isAuthenticatedParam: Cypher.Param;

    constructor({
        requireAuthentication,
        filters,
        isAuthenticatedParam,
    }: {
        requireAuthentication: boolean;
        filters: Filter[];
        isAuthenticatedParam: Cypher.Param;
    }) {
        super();
        this.requireAuthentication = requireAuthentication;
        this.children = filters;
        this.isAuthenticatedParam = isAuthenticatedParam;
    }

    public getPredicate(context: QueryASTContext): Cypher.Predicate | undefined {
        let authenticationPredicate: Cypher.Predicate | undefined;
        if (this.requireAuthentication) {
            authenticationPredicate = Cypher.eq(this.isAuthenticatedParam, Cypher.true); // TODO: use it in the context
        }

        const innerPredicate = Cypher.and(
            authenticationPredicate,
            ...this.children.map((c) => c.getPredicate(context))
        );
        if (!innerPredicate) return undefined;
        return innerPredicate;
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        return this.children.flatMap((c) => c.getSubqueries(context));
    }

    public getSelection(context: QueryASTContext): Array<Cypher.Match | Cypher.With> {
        return this.children.flatMap((c) => c.getSelection(context));
    }

    public getChildren(): QueryASTNode[] {
        return [...this.children];
    }
}

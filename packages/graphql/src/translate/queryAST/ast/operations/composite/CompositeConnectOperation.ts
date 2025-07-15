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

import type { Clause } from "@neo4j/cypher-builder";
import { filterTruthy } from "../../../../../utils/utils";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import type { OperationTranspileResult } from "../operations";
import { MutationOperation } from "../operations";
import type { CompositeConnectPartial } from "./CompositeConnectPartial";

export class CompositeConnectOperation extends MutationOperation {
    private partials: CompositeConnectPartial[] = [];

    constructor({ partials }: { partials: CompositeConnectPartial[] }) {
        super();
        this.partials = partials;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([...this.partials]);
    }

    transpile(context: QueryASTContext): OperationTranspileResult {
        const clauses = this.partials.flatMap((partial) => {
            return partial.transpile(context).clauses;
        });
        return {
            projectionExpr: context.returnVariable,
            clauses,
        };
    }

    getAuthorizationSubqueries(context: QueryASTContext): Clause[] {
        return this.partials.flatMap((partial) => {
            return partial.getAuthorizationSubqueries(context);
        });
    }
}

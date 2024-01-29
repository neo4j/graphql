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
import type { QueryASTContext } from "../QueryASTContext";
import type { EntitySelection } from "../selection/EntitySelection";
import { Operation, type OperationTranspileResult } from "./operations";
import type { QueryASTNode } from "../QueryASTNode";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";

export class CypherFieldOperation extends Operation {
    private selection: EntitySelection;
    s;
    constructor(selection: EntitySelection) {
        super();
        this.selection = selection;
    }

    public getChildren(): QueryASTNode[] {
        return [this.selection];
    }

    public transpile(context: QueryASTContext<Cypher.Node | undefined>): OperationTranspileResult {
        // eslint-disable-next-line prefer-const
        let { selection: matchClause } = this.selection.apply(context);
        const clauses: Cypher.Clause[] = [matchClause];

        clauses.push(new Cypher.Return(context.returnVariable));
        return {
            clauses,
            projectionExpr: context.returnVariable,
        };
    }
}

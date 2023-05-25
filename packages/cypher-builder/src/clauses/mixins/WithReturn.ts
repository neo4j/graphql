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

import type { ProjectionColumn } from "../sub-clauses/Projection";
import { Return } from "../Return";
import { ClauseMixin } from "./ClauseMixin";

export abstract class WithReturn extends ClauseMixin {
    protected returnStatement: Return | undefined;

    public return(clause: Return): Return;
    public return(...columns: Array<"*" | ProjectionColumn>): Return;
    public return(clauseOrColumn: Return | "*" | ProjectionColumn, ...columns: Array<"*" | ProjectionColumn>): Return {
        if (clauseOrColumn instanceof Return) {
            return this.addReturnStatement(clauseOrColumn);
        }

        return this.addColumnsToReturnClause(clauseOrColumn, ...columns);
    }

    private addColumnsToReturnClause(...columns: Array<"*" | ProjectionColumn>): Return {
        let returnStatement = this.returnStatement;
        if (!returnStatement) {
            returnStatement = this.addReturnStatement(new Return());
        }

        returnStatement.addColumns(...columns);
        return returnStatement;
    }

    private addReturnStatement(clause: Return): Return {
        this.returnStatement = clause;
        this.addChildren(this.returnStatement);
        return clause;
    }
}

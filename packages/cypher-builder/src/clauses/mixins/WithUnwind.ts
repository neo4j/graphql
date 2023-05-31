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

import { ClauseMixin } from "./ClauseMixin";
import type { ProjectionColumn } from "../sub-clauses/Projection";
import { Unwind } from "../Unwind";

export abstract class WithUnwind extends ClauseMixin {
    protected unwindStatement: Unwind | undefined;

    public unwind(clause: Unwind): Unwind;
    public unwind(...columns: Array<ProjectionColumn>): Unwind;
    public unwind(clauseOrColumn: Unwind | ProjectionColumn, ...columns: Array<ProjectionColumn>): Unwind {
        if (clauseOrColumn instanceof Unwind) {
            return this.addUnwindStatement(clauseOrColumn);
        }

        return this.addColumnsToUnwindClause(clauseOrColumn, ...columns);
    }

    private addColumnsToUnwindClause(...columns: Array<"*" | ProjectionColumn>): Unwind {
        let unwindStatement = this.unwindStatement;
        if (!unwindStatement) {
            unwindStatement = this.addUnwindStatement(new Unwind());
        }

        unwindStatement.addColumns(...columns);
        return unwindStatement;
    }

    private addUnwindStatement(clause: Unwind): Unwind {
        this.unwindStatement = clause;
        this.addChildren(this.unwindStatement);
        return clause;
    }
}

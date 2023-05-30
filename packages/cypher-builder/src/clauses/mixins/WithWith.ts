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
import type { WithProjection } from "../With";
import { With } from "../With";

// Sorry for this name, at least it is funny
export abstract class WithWith extends ClauseMixin {
    protected withStatement: With | undefined;

    public with(clause: With): With;
    public with(...columns: Array<"*" | WithProjection>): With;
    public with(clauseOrColumn: With | "*" | WithProjection, ...columns: Array<"*" | WithProjection>): With {
        if (clauseOrColumn instanceof With) {
            return this.addWithStatement(clauseOrColumn);
        }

        return this.addColumnsToWithClause(clauseOrColumn, ...columns);
    }

    private addColumnsToWithClause(...columns: Array<"*" | WithProjection>): With {
        let withStatement = this.withStatement;
        if (!withStatement) {
            withStatement = this.addWithStatement(new With());
        }

        withStatement.addColumns(...columns);
        return withStatement;
    }

    private addWithStatement(clause: With): With {
        this.withStatement = clause;
        this.addChildren(this.withStatement);
        return clause;
    }
}

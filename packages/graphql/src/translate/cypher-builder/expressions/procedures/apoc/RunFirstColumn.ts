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

import { CypherASTNode } from "../../../CypherASTNode";
import type { Clause } from "../../../clauses/Clause";
import type { Variable } from "../../../variables/Variable";
import type { CypherEnvironment } from "../../../Environment";

export class RunFirstColumn extends CypherASTNode {
    private innerClause: Clause;
    private variables: Variable[];
    private expectMultipleValues: boolean;

    constructor(clause: Clause, variables: Variable[], expectMultipleValues = true) {
        super();
        this.innerClause = clause;
        this.expectMultipleValues = expectMultipleValues;
        this.variables = variables;
    }

    public getCypher(env: CypherEnvironment): string {
        const clauseStr = this.innerClause.getRoot().getCypher(env);

        const params: Record<string, string> = {};
        for (const variable of this.variables) {
            const globalScopeName = variable.getCypher(env);
            const key = env.getVariableId(variable);
            params[key] = globalScopeName;
        }

        const paramsStr = Object.entries(params)
            .map(([key, value]) => {
                return `${key}: ${value}`;
            })
            .join(", ");

        if (this.expectMultipleValues) {
            return `apoc.cypher.runFirstColumnMany("${this.escapeQuery(clauseStr)}", { ${paramsStr} })`;
        }

        return `apoc.cypher.runFirstColumnSingle("${this.escapeQuery(clauseStr)}", { ${paramsStr} })`;
    }

    private escapeQuery(query: string): string {
        // TODO: Should single quotes be escaped?
        // return query.replace(/("|')/g, "\\$1");
        return query.replace(/("|\\)/g, "\\$1");
    }
}

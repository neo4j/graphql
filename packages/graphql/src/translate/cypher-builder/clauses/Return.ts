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

import { Clause } from "./Clause";
import type { CypherEnvironment } from "../Environment";
import type { Expr } from "../types";
import { Literal, Variable } from "../CypherBuilder";

export type ReturnColumn = Expr | [Expr, string | Variable | Literal];

export class Return extends Clause {
    private columns: ReturnColumn[] = [];
    private isStar = false;

    constructor(...columns: ReturnColumn[]);
    constructor(starOrColumn: "*" | ReturnColumn, ...columns: ReturnColumn[]);
    constructor(starOrColumn: "*" | ReturnColumn | undefined, ...columns: ReturnColumn[]) {
        super();
        if (starOrColumn === "*") {
            this.isStar = true;
            this.columns = columns;
        } else if (starOrColumn) {
            this.columns = [starOrColumn, ...columns];
        } else {
            this.columns = columns;
        }
    }

    public addReturnColumn(...columns: ReturnColumn[]): void {
        this.columns.push(...columns);
    }

    public getCypher(env: CypherEnvironment): string {
        let columnsStrs = this.columns.map((column) => {
            return this.serializeColumn(column, env);
        });

        // Only a single star at the beginning is allowed
        if (this.isStar) {
            columnsStrs = ["*", ...columnsStrs];
        }

        return `RETURN ${columnsStrs.join(", ")}`;
    }

    private serializeColumn(column: ReturnColumn, env: CypherEnvironment): string {
        const hasAlias = Array.isArray(column);
        if (hasAlias) {
            const exprStr = column[0].getCypher(env);
            let alias = column[1];
            if (typeof alias === "string") {
                alias = new Literal(alias);
            }

            return `${exprStr} AS ${alias.getCypher(env)}`;
        }
        return column.getCypher(env);
    }
}

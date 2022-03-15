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

import { joinStrings } from "../../../utils/utils";
import { CypherContext } from "../CypherContext";
import { Query } from "./Query";

export class Call extends Query {
    private withStatement: Array<string>;
    private returnStatement: string;

    constructor(query: Query, withVars: Array<string> = [], returnStatement = "RETURN COUNT(*)", parent?: Query) {
        super(parent);
        this.withStatement = withVars;
        this.returnStatement = returnStatement;
        this.addStatement(query);
    }

    public cypher(_context: CypherContext, childrenCypher: string): string {
        let withStr = "";
        if (this.withStatement.length > 0) {
            withStr = `\tWITH ${this.withStatement.join(", ")}`;
        }
        return joinStrings([withStr, "CALL {", `${withStr}`, `\t${childrenCypher}`, `\t${this.returnStatement}`, "}"]);
    }
}

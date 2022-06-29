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

import { stringifyObject } from "../../utils/stringify-object";
import { CypherContext } from "../CypherContext";
import { Param } from "./Param";
import { CypherParameter, CypherVariable } from "./References";

/** Defines a random variable defined within cypher */
export class Variable implements CypherVariable {
    public readonly prefix = "var";

    constructor(private input: Record<string, CypherVariable | CypherParameter>) {}

    public getCypher(context: CypherContext): string {
        const serializedVariables = this.serializeVariables(context);
        return stringifyObject(serializedVariables);
    }

    protected serializeVariables(context: CypherContext): Record<string, string> {
        return Object.entries(this.input).reduce((acc, [key, variable]) => {
            let variableId: string;
            if (variable instanceof Param) {
                variableId = context.getParamId(variable);
            } else {
                variableId = context.getVariableId(variable);
            }

            if (!variableId) {
                throw new Error("Variable id not found in Variable");
            }

            acc[key] = variableId;
            return acc;
        }, {});
    }
}

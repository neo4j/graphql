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

import { isString } from "graphql-compose";
import { NamedVariable, Variable } from "../variables/Variable";
import type { CypherEnvironment } from "../Environment";
import { Clause } from "./Clause";
import { compileCypherIfExists } from "../utils";

type WithVariable = Variable | string;
type WithInputElement = WithVariable | [WithVariable, WithVariable];

type WithVariableAndAlias = {
    variable: Variable;
    alias?: Variable;
};

export class With extends Clause {
    private variables: WithVariableAndAlias[] = [];
    private star = false;

    constructor(str: "*");
    constructor(...variables: Array<WithInputElement>);
    constructor(str1: WithInputElement | "*", ...variables: Array<WithInputElement>) {
        super();
        if (str1 === "*") {
            this.star = true;
        } else {
            this.variables = this.parseVarInput([str1, ...variables]);
        }
    }

    public getCypher(env: CypherEnvironment): string {
        if (this.star === true) {
            return `WITH *`;
        }

        const projection = this.variables
            .map((v) => {
                const varCypher = v.variable.getCypher(env);
                const aliasCypher = compileCypherIfExists(v.alias, env, { prefix: " AS " });
                return `${varCypher}${aliasCypher}`;
            })
            .join(",");

        return `WITH ${projection}`;
    }

    private parseVarInput(variables: Array<WithInputElement>): WithVariableAndAlias[] {
        return variables.map((rawVar) => {
            if (Array.isArray(rawVar)) {
                const [variableOrString, aliasOrString] = rawVar;

                return {
                    variable: this.varOrStringToVar(variableOrString),
                    alias: this.varOrStringToVar(aliasOrString),
                };
            }
            return {
                variable: this.varOrStringToVar(rawVar),
            };
        });
    }

    private varOrStringToVar(rawVar: Variable | string): Variable {
        if (isString(rawVar)) {
            return new NamedVariable(rawVar);
        }
        return rawVar;
    }
}

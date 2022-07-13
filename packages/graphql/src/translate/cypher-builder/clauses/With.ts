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
import { RawVariable, Variable } from "../variables/Variable";
import type { CypherEnvironment } from "../Environment";
import { Clause } from "./Clause";

export class With extends Clause {
    private variables: Variable[] = [];
    private star = false;

    constructor(variables: Array<Variable | string> | "*", parent?: Clause) {
        super(parent);

        if (Array.isArray(variables)) {
            this.variables = variables.map((rawVar) => {
                if (isString(rawVar)) {
                    return new RawVariable(rawVar);
                }
                return rawVar;
            });
        } else {
            this.star = true;
        }
    }

    protected cypher(env: CypherEnvironment): string {
        if (this.star === true) {
            return `WITH *`;
        }

        const projection = this.variables
            .map((v) => {
                return env.getVariableId(v);
            })
            .join(",");

        return `WITH ${projection}`;
    }
}

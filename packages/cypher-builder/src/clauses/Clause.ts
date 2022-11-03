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

import { CypherASTNode } from "../CypherASTNode";
import { CypherEnvironment, EnvPrefix } from "../Environment";
import type { CypherResult } from "../types";
import { convertToCypherParams } from "../utils/convert-to-cypher-params";
import { padBlock } from "../utils/utils";

const customInspectSymbol = Symbol.for("nodejs.util.inspect.custom");

/** Represents a clause AST node */
export abstract class Clause extends CypherASTNode {
    /** Compiles a clause into Cypher and params */
    public build(prefix?: string | EnvPrefix | undefined, extraParams: Record<string, any> = {}): CypherResult {
        if (this.isRoot) {
            const env = this.getEnv(prefix);
            const cypher = this.getCypher(env);

            const cypherParams = convertToCypherParams(extraParams);
            env.addExtraParams(cypherParams);
            return {
                cypher,
                params: env.getParams(),
            };
        }
        const root = this.getRoot() as Clause;
        return root.build(prefix, extraParams);
    }

    private getEnv(prefix?: string | EnvPrefix): CypherEnvironment {
        return new CypherEnvironment(prefix);
    }

    // Custom string for browsers and templating
    public toString() {
        const cypher = padBlock(this.build().cypher);
        return `<Clause ${this.constructor.name}> """\n${cypher}\n"""`;
    }

    // /** Custom log for console.log in Node */
    [customInspectSymbol](): string {
        return this.toString();
    }
}

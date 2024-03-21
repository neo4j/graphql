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
import Cypher from "@neo4j/cypher-builder";
import type { Argument } from "../../../schema-model/argument/Argument";

export function replaceArgumentsInStatement({
    env,
    definedArguments,
    rawArguments,
    statement,
}: {
    env: Cypher.Environment;
    definedArguments: Argument[];
    rawArguments: Record<string, any>;
    statement: string;
}): string {
    let cypherStatement = statement;
    sortArgumentsByLength(definedArguments).forEach((arg) => {
        const value = rawArguments[arg.name];
        if (value === undefined || value === null) {
            cypherStatement = cypherStatement.replaceAll(`$${arg.name}`, "NULL");
        } else {
            const paramName = new Cypher.Param(value).getCypher(env);
            cypherStatement = cypherStatement.replaceAll(`$${arg.name}`, paramName);
        }
    });

    return cypherStatement;
}

// This sorting is needed to make sure that replace replace first the longer names #4908
function sortArgumentsByLength(args: Argument[]): Argument[] {
    return args.sort((a, b) => {
        return b.name.length - a.name.length;
    });
}

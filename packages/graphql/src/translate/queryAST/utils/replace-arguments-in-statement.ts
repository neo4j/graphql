/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import Cypher from "@neo4j/cypher-builder";
import type { Argument } from "../../../schema-model/argument/Argument";

export function replaceArgumentsInStatement({
    env,
    definedArguments,
    rawArguments,
    statement,
}: {
    env: Cypher.RawCypherContext;
    definedArguments: Argument[];
    rawArguments: Record<string, any>;
    statement: string;
}): string {
    const argNames = definedArguments.map((arg) => arg.name);
    if (argNames.length === 0) {
        return statement;
    }
    const reg = new RegExp(`\\$(${argNames.join("|")})\\b`, "g");
    const paramsRecord = new Map<unknown, string>();

    return statement.replaceAll(reg, (_match, arg): string => {
        const value = rawArguments[arg];
        if (value === undefined || value === null) {
            return "NULL";
        } else {
            const storedParamName = paramsRecord.get(value);
            if (storedParamName) {
                return storedParamName;
            }

            const paramName = env.compile(new Cypher.Param(value));
            paramsRecord.set(value, paramName);
            return paramName;
        }
    });
}

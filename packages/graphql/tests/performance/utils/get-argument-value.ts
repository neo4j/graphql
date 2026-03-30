/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export function getArgumentValue(argName: string): string | undefined {
    const runsArg = process.argv.indexOf(argName);
    if (runsArg === -1) return undefined;
    const argValue = process.argv[runsArg + 1];
    if (argValue === undefined) throw new Error(`arg ${argName} requires a value`);
    return argValue;
}

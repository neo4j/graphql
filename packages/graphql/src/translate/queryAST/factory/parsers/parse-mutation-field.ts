/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export type MutationOperator =
    | "SET"
    | "PUSH"
    | "POP"
    | "ADD"
    | "SUBTRACT"
    | "MULTIPLY"
    | "DIVIDE"
    | "INCREMENT"
    | "DECREMENT";

export type MutationRegexGroups = {
    fieldName: string;
    operator: MutationOperator | undefined;
};

const mutationRegEx =
    /(?<fieldName>[_A-Za-z]\w*?)(?:_(?<operator>SET|PUSH|POP|ADD|SUBTRACT|MULTIPLY|DIVIDE|INCREMENT|DECREMENT))?$/;

export function parseMutationField(field: string): MutationRegexGroups {
    const match = mutationRegEx.exec(field);

    return match?.groups as MutationRegexGroups;
}

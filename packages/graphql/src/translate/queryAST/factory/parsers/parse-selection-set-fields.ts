/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export type SelectionSetFieldRegexGroups = {
    fieldName: string;
    isConnection: boolean;
    isAggregation: boolean;
};

const SelectionSetFieldRegex = /(?<fieldName>[_A-Za-z]\w*?)(?<isConnection>Connection)?(?<isAggregation>Aggregate)?$/;

export function parseSelectionSetField(field: string): SelectionSetFieldRegexGroups {
    const match = SelectionSetFieldRegex.exec(field);
    const matchGroups = match?.groups as {
        fieldName: string;
        isConnection?: string;
        isAggregation?: string;
    };
    return {
        fieldName: matchGroups.fieldName,
        isConnection: Boolean(matchGroups.isConnection),
        isAggregation: Boolean(matchGroups.isAggregation),
    };
}

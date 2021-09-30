export function stringAggregationQuery(matchPattern: string, fieldName: string, targetAlias: string): string {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `MATCH ${matchPattern}
        WITH ${targetAlias} as ${targetAlias}
        ORDER BY size(${fieldPath}) DESC
        WITH collect(${fieldPath}) as list
        RETURN {longest: head(list), shortest: last(list)}`;
}

export function numberAggregationQuery(matchPattern: string, fieldName: string, targetAlias: string): string {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `MATCH ${matchPattern}
        RETURN {min: MIN(${fieldPath}), max: MAX(${fieldPath}), average: AVG(${fieldPath})}`;
}

export function defaultAggregationQuery(matchPattern: string, fieldName: string, targetAlias: string): string {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `MATCH ${matchPattern}
        RETURN {min: MIN(${fieldPath}), max: MAX(${fieldPath})}`;
}

export function countQuery(matchPattern: string, targetAlias: string): string {
    return `MATCH ${matchPattern} RETURN COUNT(${targetAlias})`;
}

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export const multipleConditionsAggregationMap = {
    AND: (results: boolean[]): boolean => {
        for (const res of results) {
            if (!res) {
                return false;
            }
        }
        return true;
    },
    OR: (results: boolean[]): boolean => {
        for (const res of results) {
            if (res) {
                return true;
            }
        }
        return false;
    },
    NOT: (result: boolean): boolean => {
        return !result;
    },
};

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

import type { LogicalOperators, WhereOperator } from "../../ast/filters/Filter";

export type WhereRegexGroups = {
    fieldName: string;
    isAggregate: boolean;
    operator: WhereOperator | undefined;
    prefix?: string;
    isNot: boolean;
    isConnection: boolean;
};

export const whereRegEx =
    /(?<prefix>\w*\.)?(?<fieldName>[_A-Za-z]\w*?)(?<isConnection>Connection)?(?<isAggregate>Aggregate)?(?:_(?<operator>NOT|NOT_IN|IN|NOT_INCLUDES|INCLUDES|MATCHES|NOT_CONTAINS|CONTAINS|NOT_STARTS_WITH|STARTS_WITH|NOT_ENDS_WITH|ENDS_WITH|EQ|LT|LTE|GT|GTE|DISTANCE|ALL|NONE|SINGLE|SOME))?$/;

export function parseWhereField(field: string): WhereRegexGroups {
    const match = whereRegEx.exec(field);

    const matchGroups = match?.groups as {
        fieldName: string;
        isAggregate?: string;
        operator?: string;
        prefix?: string;
        isConnection?: string;
    };

    let isNot = false;
    let operator = undefined as WhereOperator | undefined;

    if (matchGroups.operator) {
        const notSplit = matchGroups.operator.split("NOT_");
        if (notSplit.length === 2) {
            isNot = true;
            operator = notSplit[1] as WhereOperator;
        } else if (matchGroups.operator === "NOT" || matchGroups.operator === "NONE") {
            isNot = true;
            if (matchGroups.operator === "NONE") {
                operator = notSplit[0] as WhereOperator;
            }
        } else {
            operator = notSplit[0] as WhereOperator;
        }
    }

    return {
        fieldName: matchGroups.fieldName,
        isAggregate: Boolean(matchGroups.isAggregate),
        operator,
        isNot,
        prefix: matchGroups.prefix,
        isConnection: Boolean(matchGroups.isConnection),
    };
}

type ConnectionWhereArgField = {
    isNot: boolean;
    fieldName: "node" | "edge" | LogicalOperators;
};

export function parseConnectionWhereFields(key: string): ConnectionWhereArgField {
    const splitKey = key.split("_NOT");
    const isNot = splitKey.length > 1;
    return {
        fieldName: splitKey[0] as "node" | "edge" | LogicalOperators,
        isNot,
    };
}

export const aggregationFieldRegEx =
    /(?<fieldName>[_A-Za-z]\w*?)(?:_(?<aggregationOperator>AVERAGE|MAX|MIN|SUM|SHORTEST|LONGEST))?(?:_LENGTH)?(?:_(?<logicalOperator>EQUAL|GT|GTE|LT|LTE))?$/;

export type AggregationOperator = "AVERAGE" | "SHORTEST" | "LONGEST" | "MIN" | "MAX" | "SUM";
export type AggregationLogicalOperator = "EQUAL" | "GT" | "GTE" | "LT" | "LTE";

export type AggregationFieldRegexGroups = {
    fieldName: string;
    aggregationOperator?: AggregationOperator;
    logicalOperator?: AggregationLogicalOperator;
};

export function parseAggregationWhereFields(field: string): AggregationFieldRegexGroups {
    const match = aggregationFieldRegEx.exec(field);

    const matchGroups = match?.groups as {
        fieldName: string;
        aggregationOperator?: string;
        logicalOperator?: string;
    };

    return {
        fieldName: matchGroups.fieldName,
        aggregationOperator: matchGroups.aggregationOperator as AggregationOperator | undefined,
        logicalOperator: matchGroups.logicalOperator as AggregationLogicalOperator | undefined,
    };
}

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

import type { FilterOperator } from "../../ast/filters/Filter";

type WhereRegexGroups = {
    fieldName: string;
    isAggregate: boolean;
    operator: FilterOperator | undefined;
    prefix?: string;
    isConnection: boolean;
};

// This regex is only valid for the non generic operators
const whereRegEx =
    /(?<prefix>\w*\.)?(?<fieldName>[_A-Za-z]\w*?)(?<isConnection>Connection)?(?<isAggregate>Aggregate)?(?:_(?<operator>IN|INCLUDES|MATCHES|CONTAINS|STARTS_WITH|ENDS_WITH|EQ|LT|LTE|GT|GTE|DISTANCE|ALL|NONE|SINGLE|SOME))?$/;

export function parseWhereField(field: string): WhereRegexGroups {
    const match = whereRegEx.exec(field);

    const matchGroups = match?.groups as {
        fieldName: string;
        isAggregate?: string;
        operator?: string;
        prefix?: string;
        isConnection?: string;
    };

    const operator = match?.groups?.operator as FilterOperator | undefined;

    return {
        fieldName: matchGroups.fieldName,
        isAggregate: Boolean(matchGroups.isAggregate),
        operator,
        prefix: matchGroups.prefix,
        isConnection: Boolean(matchGroups.isConnection),
    };
}

const aggregationFieldRegEx =
    /(?<fieldName>[_A-Za-z]\w*?)(?:_(?<aggregationOperator>AVERAGE|MAX|MIN|SUM|SHORTEST|LONGEST))?(?:_LENGTH)?(?:_(?<logicalOperator>EQUAL|EQ|GT|GTE|LT|LTE|IN))?$/;

export type AggregationOperator = "AVERAGE" | "SHORTEST" | "LONGEST" | "MIN" | "MAX" | "SUM";
export type AggregationLogicalOperator = "EQUAL" | "EQ" | "GT" | "GTE" | "LT" | "LTE" | "IN";

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

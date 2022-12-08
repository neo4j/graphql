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

import type { RelationshipWhereOperator, WhereOperator } from "./types";

export const comparisonMap: Record<Exclude<WhereOperator, RelationshipWhereOperator>, string> = {
    NOT: "=",
    // Numerical
    GT: ">",
    GTE: ">=",
    LT: "<",
    LTE: "<=",
    // Distance
    DISTANCE: "=",
    // String
    NOT_CONTAINS: "CONTAINS",
    CONTAINS: "CONTAINS",
    NOT_STARTS_WITH: "STARTS WITH",
    STARTS_WITH: "STARTS WITH",
    NOT_ENDS_WITH: "ENDS WITH",
    ENDS_WITH: "ENDS WITH",
    // Regex
    MATCHES: "=~",
    // Array
    NOT_IN: "IN",
    IN: "IN",
    NOT_INCLUDES: "IN",
    INCLUDES: "IN",
};

export const whereRegEx =
    /(?<prefix>\w*\.)?(?<fieldName>[_A-Za-z]\w*?)(?<isAggregate>Aggregate)?(?:_(?<operator>NOT|NOT_IN|IN|NOT_INCLUDES|INCLUDES|MATCHES|NOT_CONTAINS|CONTAINS|NOT_STARTS_WITH|STARTS_WITH|NOT_ENDS_WITH|ENDS_WITH|LT|LTE|GT|GTE|DISTANCE|ALL|NONE|SINGLE|SOME))?$/;
export type WhereRegexGroups = {
    fieldName: string;
    isAggregate?: string;
    operator?: WhereOperator;
    prefix?: string;
};

export type aggregationOperators = "SHORTEST" | "LONGEST" | "MIN" | "MAX" | "SUM";
export const aggregationFieldRegEx =
    /(?<fieldName>[_A-Za-z]\w*?)(?:_(?<aggregationOperator>AVERAGE|MAX|MIN|SUM|SHORTEST|LONGEST))?(?:_(?<logicalOperator>EQUAL|GT|GTE|LT|LTE))?$/;
export type AggregationFieldRegexGroups = {
    fieldName: string;
    aggregationOperator?: aggregationOperators;
    logicalOperator?: string;
};

export type ListPredicate = "all" | "none" | "single" | "any";

export const getListPredicate = (operator?: WhereOperator): ListPredicate => {
    switch (operator) {
        case "ALL":
            return "all";
        case "NOT":
        case "NONE":
            return "none";
        case "SINGLE":
            return "single";
        case "SOME":
        default:
            return "any";
    }
};

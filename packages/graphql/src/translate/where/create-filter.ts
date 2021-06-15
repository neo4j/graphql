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

export enum Operator {
    INCLUDES = "IN",
    IN = "IN",
    MATCHES = "=~",
    CONTAINS = "CONTAINS",
    STARTS_WITH = "STARTS WITH",
    ENDS_WITH = "ENDS WITH",
    LT = "<",
    GT = ">",
    GTE = ">=",
    LTE = "<=",
    DISTANCE = "=",
}

function createFilter({
    left,
    operator,
    right,
    not,
}: {
    left: string;
    operator: string;
    right: string;
    not?: boolean;
}): string {
    if (!Operator[operator]) {
        throw new Error(`Invalid filter operator ${operator}`);
    }

    if (not && ["MATCHES", "LT", "GT", "GTE", "LTE", "DISTANCE"].includes(operator)) {
        throw new Error(`Invalid filter operator NOT_${operator}`);
    }

    let filter = `${left} ${Operator[operator]} ${right}`;
    if (not) filter = `(NOT ${filter})`;

    return filter;
}

export default createFilter;

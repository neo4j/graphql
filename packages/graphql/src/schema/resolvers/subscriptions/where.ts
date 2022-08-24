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

import type { SubscriptionsEvent } from "../../../types";
import { compareProperties } from "./utils/compare-properties";

export function subscriptionWhere(where: Record<string, any> | undefined, event: SubscriptionsEvent): boolean {
    if (!where) {
        return true;
    }

    // TODO: filters logic goes here
    if (event.event === "create") {
        return compare(where, event.properties.new);
    }

    return compareProperties(where, event.properties.old);
}


const operatorCheckMap = {
    "_NOT": (received: string, filtered: string) => received !== filtered 
}
const getCompareFn = (operator: string | undefined) => {
    if(!operator) {
        return (received: string, filtered: string) => received === filtered;;
    }
    return operatorCheckMap[operator];
}
const removeOperatorFromKey = (operator: string | undefined, k: string) => k.replace(operator || "", "");

function compare<T> (where:  Record<string, T>, self:  Record<string, T>): boolean {
    for (const [k, v] of Object.entries(where)) {
        const operator = Object.keys(operatorCheckMap).find(op => k.endsWith(op));
        const receivedValue = self[removeOperatorFromKey(operator, k)];
        const checkEqualityFn = getCompareFn(operator).bind(null, receivedValue, v);
        if(!checkEqualityFn()) {
            return false;
        }
    };
    return true;
}
/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { LOGICAL_OPERATORS } from "../../constants";
import { isInArray } from "../../utils/is-in-array";
import type { ValueOf } from "../../utils/value-of";

type LogicalOperator = ValueOf<typeof LOGICAL_OPERATORS>;

export function isLogicalOperator(key: unknown): key is LogicalOperator {
    return isInArray(LOGICAL_OPERATORS, key);
}

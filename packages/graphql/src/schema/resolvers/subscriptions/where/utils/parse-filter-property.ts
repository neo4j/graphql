/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { parseWhereField } from "../../../../../translate/queryAST/factory/parsers/parse-where-field";

export function parseFilterProperty(key: string): { fieldName: string; operator: string | undefined } {
    // eslint-disable-next-line prefer-const
    let { fieldName, operator } = parseWhereField(key);

    return { fieldName, operator };
}

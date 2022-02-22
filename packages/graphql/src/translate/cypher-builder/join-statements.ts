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

import { joinStrings, isString, asArray, filterTruthy } from "../../utils/utils";
import { CypherStatement, CypherParams } from "../types";

/** Joins all valid cypher statements and params with given separator, ignoring empty or undefined statements */
export function joinStatements(
    statements: string | CypherStatement | Array<string | undefined | CypherStatement>,
    separator = "\n"
): CypherStatement {
    const statementsArray = filterTruthy(asArray(statements));
    const statementsStrings = statementsArray.map((statement) => {
        return getStatementString(statement);
    });
    const statementsParams = statementsArray.reduce((acc, statement) => {
        return { ...acc, ...getStatementParams(statement) };
    }, {} as CypherParams);
    return [joinStrings(statementsStrings, separator), statementsParams];
}

function getStatementString(statement: string | CypherStatement): string {
    return isString(statement) ? statement : statement[0];
}

function getStatementParams(statement: string | CypherStatement): CypherParams {
    return isString(statement) ? {} : statement[1];
}

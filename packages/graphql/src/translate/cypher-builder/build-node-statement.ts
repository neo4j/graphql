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

import { Context } from "../../types";
import { CypherStatement, CypherParams } from "../types";
import { Node } from "../../classes";
import { serializeParameters, padLeft } from "./utils";

export function buildNodeStatement({
    varName,
    node,
    context,
    parameters,
}: {
    varName: string;
    node?: Node;
    context: Context;
    parameters?: Record<string, any>;
}): CypherStatement {
    const labels = node ? node.getLabelString(context) : "";
    const [parametersQuery, parsedParameters] = parseNodeParameters(varName, parameters);

    return [`(${varName}${labels}${padLeft(parametersQuery)})`, parsedParameters];
}

function parseNodeParameters(nodeVar: string, parameters: CypherParams | undefined): CypherStatement {
    return serializeParameters(`${nodeVar}_node`, parameters);
}

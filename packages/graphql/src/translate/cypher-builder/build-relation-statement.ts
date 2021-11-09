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

import { Context, RelationField } from "../../types";
import { Node } from "../../classes";
import { CypherStatement } from "../types";
import { buildNodeStatement } from "./build-node-statement";
import { joinStatements } from "../utils";

type TargetNode = {
    varName: string;
    node?: Node;
    parameters?: Record<string, any>;
};

type TargetRelation = {
    varName: string;
    relationField: RelationField;
};

export function buildRelationStatement({
    leftNode,
    rightNode,
    context,
    relation,
}: {
    leftNode: TargetNode;
    rightNode: TargetNode;
    relation: TargetRelation;
    context: Context;
}): CypherStatement {
    const relationStatement = getRelationSubStatement(relation.relationField, relation.varName);

    const leftNodeStatement = buildNodeStatement({
        context,
        ...leftNode,
    });

    const rightNodeStatement = buildNodeStatement({
        context,
        ...rightNode,
    });

    return joinStatements([leftNodeStatement, relationStatement, rightNodeStatement], "");
}

function getRelationSubStatement(relationField: RelationField, relationshipName: string): CypherStatement {
    const leftConnection = relationField.direction === "IN" ? "<-" : "-";
    const rightConnection = relationField.direction === "OUT" ? "->" : "-";
    const relationLabel = relationField.type ? `:${relationField.type}` : "";
    const relTypeStr = `[${relationshipName || ""}${relationLabel}]`;
    // TODO: add relationField.properties
    return [`${leftConnection}${relTypeStr}${rightConnection}`, {}];
}
